const debug = require("debug")("evan:r2:keyboard")
import events = require("events")

export type IKeyboardEventType = "pgup" | "pgdown" | "down" | "up"

export class Keyboard extends events.EventEmitter {
    handleKeyDown = (e: KeyboardEvent) => {
        const code = e.keyCode || e.which

        let name

        if (code === 33) { // PgUp
            name = "pgup"
        } else if (code === 34) { // PgDown
            name = "pgdown"
        } else if ((e.ctrlKey || e.metaKey) && (code === 74 || code === 40)) { // ^down, ^j (either ctrlkey or meta)
            name = "down"
        } else if ((e.ctrlKey || e.metaKey) && (code === 75 || code === 38)) { // ^up, ^k
            name = "up"
        }

        if (name) {
            debug("pressed: %s (%d)", name, code)
            this.emit(name, e)
        }
    }

    on(event: IKeyboardEventType, listener: (e: KeyboardEvent) => void) {
        return super.on(event, listener)
    }

    start() {
        debug("started")
        window.addEventListener("keydown", this.handleKeyDown)
    }

    destroy() {
        debug("destroyed")
        window.removeEventListener("keydown", this.handleKeyDown)
        this.removeAllListeners()
    }
}
