const debug = require("debug")("evan:ide:state")
const sprintf = require("sprintf")
const cl = require("chloride")
import m = require("mobx")
import {extendObservable as xtend} from "mobx"
import util = require("./util")
import {ILog, IKeyPair, Swarm} from "../net/swarm"
import {EditorState} from "../editor/state"
import {IIndexedKeyPair} from "../storage/keychain"
import fs = require("fs")

const fib = JSON.parse(fs.readFileSync(__dirname + "/../../fixtures/programs/fib.json", "utf8"))

console.log(fib)

export class State {
    currentChannel: IIndexedKeyPair
    user: string
    channels: string[]
    logs: { [channel: string]: ILog<ILogData>[] }
    activity: { [channel: string]: IActivity }
    connectionStatus: { [channel: string]: IConnectionStatus }
    lastSeen: { [channel: string]: number }
    keypairs: { [channel: string]: IKeyPair }
    peers: { [channel: string]: string[] }
    editorStates: { [channel: string]: EditorState }

    @m.computed get currentChannelId(): string {
        return this.currentChannel && this.currentChannel.id
    }

    private refs: (() => void)[] = [] // mobx disposables: free'd with destroy()

    swarm: Swarm<ILogData>
    db: LevelUp

    constructor(db: LevelUp) {
        xtend(this, {
            currentChannel: { id: util.NONE, public: "" },
            user: "user-" + util.getRandomString(2),
            channels: [],
            logs: {},
            activity: {},
            connectionStatus: {},
            peers: {},
            lastSeen: {},
            keypairs: {},
            editorStates: {}
        })

        const free = m.intercept(this, "currentChannel", (change) => { // prehook
            const {channels} = this
            const {newValue} = change

            if (channels.indexOf(newValue.id) === -1) {
                this.ensureIndexes(newValue) // make sure indexes are observable
            } else {
                this.lastSeen[newValue.id] = Date.now() // seen activity
            }

            return change
        })

        this.refs.push(free)

        this.swarm = new Swarm({ user: this.user, db, sodium: cl })

        const {logs, swarm, peers, connectionStatus} = this

        swarm.on("join", (channel: string) => {
            debug("joined swarm: %s", channel)
            connectionStatus[channel] = IConnectionStatus.Connected
        })

        swarm.on("part", (channel: string) => {
            debug("left channel: %s", channel)
        })

        swarm.on("change", (channel: string, log: ILog<ILogData>[]) => {
            m.transaction(() => {
                logs[channel].push(...log)
                logs[channel].sort((a, b) => a.time < b.time ? -1 : 1) // XXX: see: State (optimize later)
            })
        })

        swarm.on("peer", (channel: string, peer: any, id: string) => {
            debug("peer connect: channel: %s peer-id: %s", channel, id)
            peers[channel].push(id)
        }) // connected to a new peer

        swarm.on("disconnect", (channel: string, id: string) => {
            debug("peer disconnect: channel: %s peer-id: %s", channel, id)
            peers[channel].splice(peers[channel].indexOf(id), 1)
        }) // peer is disconnected
    }

    destroy() {
        debug("destroyed")
        this.refs.forEach(ref => ref()) // destroy mobx listeners
        this.swarm.destroy()
    }

    @m.action ensureIndexes(identity: IIndexedKeyPair | IIndexedKeyPair[]) {
        const {
            channels,
            logs,
            peers,
            activity,
            connectionStatus,
            lastSeen,
            keypairs,
            user,
            editorStates
        } = this

        const idents: IIndexedKeyPair[] = Array.isArray(identity) ? identity : [ identity ]

        debug("building indexes for %d pairs of keys", idents.length)

        idents.forEach(ident => {
            const channel = ident.id

            if (channels.indexOf(channel) === -1) {
                if (!lastSeen.hasOwnProperty(channel)) {
                    xtend(lastSeen, { [channel]: 0 })
                }

                if (!logs.hasOwnProperty(channel)) {
                    xtend(logs, { [channel]: [] })

                    // update 'lastSeen' value if on the same channel:
                    // if 'currentChannel' is smth else, then the 'lastSeen' will be behind the newly
                    // added log, which will then trigger 'activity' to reset its value
                    const free = m.observe(logs[channel], (newValue) => {
                        if (this.currentChannelId === channel) { // XXX: && newValue.added.length maybe?
                            lastSeen[channel] = Date.now()
                        }
                    })

                    this.refs.push(free)
                }

                if (!activity.hasOwnProperty(channel)) {
                    xtend(activity, {
                        get [channel]() {
                            const len = logs[channel].length
                            if (logs.hasOwnProperty(channel) && len) {
                                const tail = logs[channel][len - 1] // XXX: this assumes 'logs' are sorted already
                                const modified = tail.time
                                if (lastSeen[channel] < modified) {
                                    if (tail.data.kind === ILogDataKind.Message && RegExp("\\b" + user + "\\b").test(tail.data.msg)) {
                                        return IActivity.Mentioned
                                    }
                                    return IActivity.Activity
                                }
                            }
                            return IActivity.None
                        }
                    })
                }

                if (!keypairs.hasOwnProperty(channel)) {
                    xtend(keypairs, {
                        [channel]: { public: ident.public, private: ident.private }
                    })
                }

                if (!editorStates.hasOwnProperty(channel)) {
                    // editorStates[channel] = new EditorState
                    editorStates[channel] = new EditorState
                    editorStates[channel].setResource("", fib)
                }

                if (channel !== util.STATUS) {
                    if (!peers.hasOwnProperty(channel)) {
                        xtend(peers, { [channel]: [] })
                    }

                    if (!connectionStatus.hasOwnProperty(channel)) {
                        xtend(connectionStatus, {
                            [channel]: IConnectionStatus.NotConnected as IConnectionStatus
                        })
                    }
                }

                this.channels.push(channel)
            }
        })
    }

    info(channels: string[] | string, msg: string, ...argv: any[]) {
        const {logs} = this

        if (typeof channels === "string") {
            channels = [channels]
        }

        channels
            .map(c => logs[c])
            .filter(Boolean)
            .forEach(arr => {
                arr.push({
                    time: Date.now(),
                    user: util.INFO,
                    data: {
                        kind: ILogDataKind.Info,
                        msg: sprintf(msg, ...argv)
                    }
                })
            })
    }

    // print multiline help text
    @m.action help(channels: string[] | string, text: string | Function, argv?: any) {
        text = typeof text === "string" ? text : text({ ...argv }) as string
        text.split("\n").forEach(line => {
            this.info(channels, line)
        })
    }
}

// logs
export enum ILogDataKind {
    Info = 1,
    Message = 2
}

export interface ILogTypedData {
    kind: ILogDataKind
}

export type ILogMessageData = {
    msg: string
}

export type ILogData = ILogTypedData & ILogMessageData

// activity
export enum IActivity {
    None,
    Mentioned,
    Activity
}

// connectionStatus
export enum IConnectionStatus {
    NotConnected,
    Connected
}
