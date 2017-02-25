const debug = require("debug")("evan:r2:cmdline")
import {transaction} from "mobx"
import util = require("./util")
import {STATUS} from "./util"
import {State, ILogData, ILogDataKind} from "./state"
import {Keychain, IIndexedKeyPair} from "../storage/keychain"
import {Router} from "./router"
import {Swarm, IKeyPair} from "../net/swarm"
import help = require("./help")

export type ICommandLineOptions = {
    state: State
    keychain: Keychain
    router: Router
    swarm: Swarm<ILogData>
}

export class CommandLine {
    constructor(public opts: ICommandLineOptions) {}

    private handlePart(channel?: string) { /* TODO */ }

    private handleNick(user: string) {
        // TODO: allow alphanum only
        debug("change user: %s", user)
        const {state} = this.opts
        transaction(() => {
            state.user = user
            state.info(state.currentChannelId, "You're now known as '%s'", state.user)
        })
    }

    private handleMessage(value: string) {
        const {state, swarm} = this.opts
        swarm.send(state.currentChannelId, {
            kind: ILogDataKind.Message,
            msg: value
        })
    }

    handleHelp() {
        const {state} = this.opts
        state.help(state.currentChannelId, help.main)
    }

    private handleUnknown(value: string) {
        const {state} = this.opts
        state.info(state.currentChannelId, "Unknown command: %s", value)
    }

    private handleKeyAdd(pub: string, priv?: string, cb?: (er: Error | null, sum?: string) => void) {
        const {keychain, state} = this.opts
        const pair: IKeyPair = { public: pub, private: priv }

        keychain.put(pair, (er, sum?) => {
            const stdout = [STATUS]
            if (state.currentChannelId !== STATUS) {
                stdout.push(state.currentChannelId)
            }

            if (er) {
                console.warn("could not update keychain: %s", er.message)
                state.info(stdout, "Could not update keychain (%s)", er.message) // TODO: state.warn
                if (cb) {
                    cb(er)
                }
                return
            } else if (sum) {
                const ident: IIndexedKeyPair = { id: sum, ...pair }

                transaction(() => {
                    state.ensureIndexes(ident)
                    state.keypairs[sum] = pair
                })

                if (cb) {
                    return cb(null, sum)
                }

                state.info(stdout, "Updated keychain (%s)", sum)
            }
        })
    }

    private handleInit() {
        const {state, router} = this.opts
        const keys = util.ssbkeys.generate()

        this.handleKeyAdd(keys.public, keys.private, (er: Error | null, sum: string) => {
            if (er) {
                console.error("could not init channel")
                return
            }

            router.go(sum)

            state.help(sum, help.init, { channel: sum, ...keys })
            setTimeout(() => {
                // XXX: ideally this should be handled during 'handleJoin' or 'handleRoute'
                state.info(STATUS, "Updated keychain (%s)", sum)
            }, 100)
        })
    }

    private handleKeyRemove(id: string) { /* TODO */ }

    handleJoin = (channel: string) => {
        const {router} = this.opts
        router.go((channel === STATUS) ? "" : channel)
    }

    handle = (value: string) => {
        const m = /^\/(\S+)/.exec(value)
        const cmd = (m && m[1] || "").toLowerCase()
        const argv = util.collapseWhiteSpace(value).split(/\s+/).slice(1)
        const {state} = this.opts

        if (cmd === "join" || cmd === "j") { // join
            this.handleJoin(argv[0])
        } else if (cmd === "part" || cmd === "p") { // part
            this.handlePart("not implemented")
        } else if (cmd === "nick" || cmd === "n") { // nick
            const user = argv[0]
            if (!user) {
                console.warn("could not change to empty username")
            } else {
                this.handleNick(user)
            }
        } else if (cmd === "keychain" || cmd === "kc") { // keychain
            const argv = value.split(/\s+/).slice(1)
            const subcmd = argv[0]
            if (subcmd === "add") {
                this.handleKeyAdd(argv[1], argv[2])
            } else if (subcmd === "rm") {
                this.handleKeyRemove(argv[1])
            }
        } else if (cmd === "init" || cmd === "i") { // init
            this.handleInit()
        } else if (cmd === "help" || cmd === "h") { // help
            this.handleHelp()
        } else if (cmd) {
            this.handleUnknown(cmd)
        } else if (state.currentChannelId !== STATUS) {
            this.handleMessage(value)
        }
    }

}
