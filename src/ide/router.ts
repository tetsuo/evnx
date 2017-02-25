const debug = require("debug")("evan:ide:router")
import events = require("events")
import util = require("./util")

// TODO: check out https://github.com/wearefine/fryr/blob/master/fryr.js or use 'page'

export type IRouterEventType = "route"

export class Router extends events.EventEmitter {
    handleHashChange = () => {
        const h = util.stripUrlHash(window.location.hash)
        debug("hashchange: #%s", h)
        this.emit("route", h)
    }

    on(event: IRouterEventType, listener: (hash: string) => void) {
        return super.on(event, listener)
    }

    start() {
        debug("started")
        window.addEventListener("hashchange", this.handleHashChange)
    }

    destroy() {
        debug("destroyed")
        window.removeEventListener("hashchange", this.handleHashChange)
        this.removeAllListeners()
    }

    go(s: string) {
        const h = util.stripUrlHash(s)
        debug("navigate-to: %s", h)
        window.location.hash = h
    }
}
