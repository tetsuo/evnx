const debug = require("debug")("evan:net:swarm")
import * as events from "events"
const hyperlog = require("hyperlog")
const sub = require("subleveldown")
const wswarm = require("webrtc-swarm")
const signalhub = require("signalhub")
const hsodium = require("hyperlog-sodium")
const pump = require("pump")
const shasum = require("shasum")

export class Swarm<T> extends events.EventEmitter {
    db: LevelUp
    options: ISwarmOptions

    state: ISwarmState = {
        logs: {},
        hubs: {},
        swarms: {},
        peers: {},
        onConnectListeners: {},
        onDisconnectListeners: {}
    }

    constructor(options: ISwarmOptions) {
        super()

        this.options = options
        this.db = options.db

        if (!options.hubs) {
            options.hubs = [ "https://sdf.party" ]
        }
    }

    join(keypair: IKeyPair) {
        let {
            logs,
            hubs,
            swarms,
            onConnectListeners,
            onDisconnectListeners,
            peers
        } = this.state

        const {
            wrtc,
            user
        } = this.options

        const kopts = {
            publicKey: normkey(keypair.public),
            secretKey: keypair.private && normkey(keypair.private)
        }

        const channel = shasum(kopts.publicKey.toString("hex"))

        if (swarms.hasOwnProperty(channel)) {
            debug("already joined: %s", channel)
            return void this.emit("join", channel)
        }

        const log = hyperlog(sub(this.db, channel), hsodium(this.options.sodium, kopts, { valueEncoding: "json" }))
        logs[channel] = log

        const hub = signalhub(shasum("evan-swarm." + channel), this.options.hubs)
        hubs[channel] = hub

        const swarm = wswarm(hub, { wrtc })
        swarms[channel] = swarm

        peers[channel] = {} as any

        const onconnect = (peer: ISimplePeer, id: string) => {
            debug("connect channel: %s id: %s (user: %s)", channel, id, user)
            peers[channel][id] = peer
            const logStream = logs[channel].replicate({ live: true })
            pump(peer, logStream, peer)
            this.emit("peer", channel, peer, id)
        }

        onConnectListeners[channel] = onconnect

        swarm.on("peer", onconnect)

        const ondisconnect = (peer: ISimplePeer, id: string) => {
            debug("disconnect channel: %s id: %s (user: %s)", channel, id, user)
            delete peers[channel][id]
            this.emit("disconnect", channel, peer, id)
        }

        onDisconnectListeners[channel] = ondisconnect
        swarm.on("disconnect", ondisconnect)

        swarm.on("error", (er: any) => {
            console.error("swarm err: %s", er.message)
            console.error(er)
        })

        debug("joined channel: %s user: %s", channel, user)

        const buf = [] as any

        log
            .createReadStream()
            .on("data", (data: any) => { buf.push({ ...data.value, ...{ change: data.change } }) }) // XXX: type
            .on("end", () => {
                this.emit("join", channel)
                this.emit("change", channel, buf)

                // start listening from the last change
                const last = buf.length && buf[buf.length - 1]

                let hyperLogOptions: IHyperLogOptions = { live: true }

                if (last) {
                    hyperLogOptions.since = last.change
                }

                log
                    .createReadStream(hyperLogOptions)
                    .on("data", (data: { value: string }) => {
                        debug("log channel: %s %O", channel, data)
                        this.emit("change", channel, [data.value])
                    })
                    .on("error", (er: any) => {
                        console.error("error: %s", er.message)
                        console.error(er)
                    })
            })
            .on("error", (er: any) => {
                console.error("error: %s", er.message)
                console.error(er)
            })

        return log
    }

    part(channel: string) {
        let { swarms } = this.state

        debug("part channel: %s user: %s", channel, this.options.user)

        if (!swarms.hasOwnProperty(channel)) {
            throw new Error("channel does not exist")
        }

        let {
            logs,
            peers,
            onConnectListeners,
            onDisconnectListeners
        } = this.state

        swarms[channel].removeListener("connect", onConnectListeners[channel])
        swarms[channel].removeListener("disconnect", onDisconnectListeners[channel])

        swarms[channel].close()

        Object.keys(peers[channel]).forEach(d => {
            peers[channel][d].destroy()
            peers[channel][d] = null
        })

        delete logs[channel]
        delete swarms[channel]
        delete peers[channel]
        delete onConnectListeners[channel]
        delete onDisconnectListeners[channel]
    }

    send(channel: string, value: T, cb?: (err: any, node: any) => void) {
        const {logs} = this.state
        const {user} = this.options

        if (!logs.hasOwnProperty(channel)) {
            throw new Error("channel does not exist")
        }

        const log: ILog<T> = {
            time: Date.now(),
            user: user,
            data: value
        }

        debug("append to %s: %O", channel, log)
        logs[channel].append(log, cb)
    }

    destroy() {
        throw new Error("not implemented")
    }
}

export function normkey(s: string): Buffer {
  if (/\.ed25519$/.test(s)) {
      const b64 = s.replace(/\.ed25519$/, "").replace(/^@/, "")
      return new Buffer(b64, "base64")
  }

  if (!Buffer.isBuffer(s)) {
      return new Buffer(s, "hex")
  }

  return s
}

export type ILog<T> = {
    time: number
    user: string
    data: T
}

export type IKeyPair = {
    public: string
    private?: string
}

export type ISwarmOptions = {
    user: string
    hubs?: string[]
    wrtc?: any
    db: LevelUp
    sodium: any
}

export type ISwarmState = {
    logs: { [channel: string]: IHyperLog } // hyperlog
    hubs: { [channel: string]: NodeJS.EventEmitter } // signalhub
    swarms: { [channel: string]: IWebRTCSwarm } // webrtc-swarm
    peers: { [channel: string]: ISimplePeer } // simple-peer XXX: typings not correct
    onConnectListeners: { [s: string]: any }
    onDisconnectListeners: { [s: string]: any }
}

export type ISimplePeer = NodeJS.EventEmitter & IDestroyable

export type IDestroyable = {
    destroy: () => void
}

export type IHyperLog = NodeJS.EventEmitter & {
    replicate: (d: any) => void
    append: (d: any, cb?: any) => void
}

export type IHyperLogOptions = {
    since?: number
    live: boolean
}

export type IWebRTCSwarm = NodeJS.EventEmitter & {
    close: () => void
}
