const debug = require("debug")("evan:r2:main")
import * as React from "react"
import * as ReactDOM from "react-dom"
import {Provider, observer} from "mobx-react"
import {transaction} from "mobx"
import level = require("levelup")
const leveljs = require("level-js")
const sub = require("subleveldown")
const shasum = require("shasum")
import {State, IConnectionStatus} from "./state"
import {Router} from "./router"
import {DB, KEYCHAIN} from "./util"
import util = require("./util")
import {Keychain} from "./keychain"
import {CommandLine, ICommandLineOptions} from "./cmdline"
import {Layout} from "./layout"
import {normkey} from "./swarm"
import {Keyboard} from "./keyboard"

type IMainProps = ICommandLineOptions & { kb: Keyboard }

@observer
class Main extends React.Component<IMainProps, void> {
    cmdline: CommandLine

    constructor(props: React.Props<IMainProps>, ctx: any) {
        super(props, ctx)
        this.cmdline = new CommandLine(this.props)
    }

    handleRoute = (route: string) => {
        let channel = route.replace(/[\s\xa0]+/g, "") // remove whitespace
        const {state, keychain, swarm} = this.props

        debug("route: %s", channel)

        if (!channel) {
            state.currentChannel = util.statusKeyPair
        } else {
            keychain.get(channel, (er, keypair?) => {
                if (er) {
                    debug("keypair error: #%s (%s)", channel, er.message)

                    state.currentChannel = util.statusKeyPair
                    state.info(util.STATUS, "Key not found (%s)", channel)

                    return
                }

                let printJoined = true

                if (state.connectionStatus[channel] === IConnectionStatus.Connected)  {
                    printJoined = false
                }

                state.currentChannel = {
                    id: channel,
                    public: keypair.public,
                    private: keypair.private
                }

                if (printJoined) {
                    state.info([util.STATUS, state.currentChannelId], "Joined #%s", state.currentChannelId)
                }

                swarm.join(keypair)
            })
        }
    }

    handleKeyDown = (e: KeyboardEvent) => {
        e.preventDefault()
        console.log(e)
        const {channels, currentChannelId} = this.props.state
        const ix = channels.indexOf(currentChannelId)
        const id = channels[(ix + 1) % channels.length]
        this.props.router.go(id)
    }

    handleKeyUp = (e: KeyboardEvent) => {
        e.preventDefault()
        console.log(e)
        const {channels, currentChannelId} = this.props.state
        let ix = channels.indexOf(currentChannelId)
        ix = ix === 0 ? channels.length : ix
        const id = channels[(ix - 1) % channels.length]
        this.props.router.go(id)
    }

    componentDidMount() {
        const {keychain, router, state, kb} = this.props

        router.on("route", this.handleRoute)

        kb.on("up",  this.handleKeyUp)
        kb.on("down",  this.handleKeyDown)

        keychain.list((er, keypairs) => {
            if (er) {
                console.error("could not read keychain (%s) ", er.message)
                // TODO: print error
                return
            }

            debug("found %d keys", keypairs.length)

            router.start()
            kb.start()

            transaction(() => {
                state.ensureIndexes([util.statusKeyPair].concat(keypairs.map(d => {
                    return {
                        id: shasum(normkey(d.public).toString("hex")),
                        public: d.public,
                        private: d.private
                    }
                })))

                // include keys
                keypairs.forEach(pair => {
                    state.keypairs[pair.id].public = pair.public
                    state.keypairs[pair.id].private = pair.private
                })
            })

            // router doesn't emit anything when booting, so we manually kick it silently
            const whash = util.stripUrlHash(window.location.hash)
            router.emit("route", whash)
        })
    }

    componentWillUnmount() {
        const {router, kb} = this.props
        router.removeListener("route", this.handleRoute)
        kb.removeListener("down",  this.handleKeyUp)
        kb.removeListener("up",  this.handleKeyDown)
    }

    render() {
        const {state} = this.props
        return <Provider state={state}>
            <Layout
                state={state}
                onCommandLine={this.cmdline.handle}
                onSidebarSelect={this.cmdline.handleJoin}
                onTabSelect={() => {/* TODO */}}
            />
        </Provider>
    }
}

// attach

const db = level(DB, { db: leveljs })
const router = new Router
const keychain = new Keychain(sub(db, KEYCHAIN, { valueEncoding: "json" }))
const kb = new Keyboard

const state = new State(db)

if (process.env.NODE_ENV !== "production") {
    window["debug"] = require("debug")
    window["state"] = state
}

ReactDOM.render(<Main {...{ router, db, keychain, state, swarm: state.swarm, kb }} />,
    document.getElementById("main"))
