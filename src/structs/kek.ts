import fastjsonpatch = require("fast-json-patch")
import mobx = require("mobx")
import through = require("through2")
const multi = require("multi-write-stream")
const readonly = require("read-only-stream")
const eos = require("end-of-stream")
const debug = require("debug")("evan:structs:kek")

export type IMultiWriteStream = {
    add: (stream: NodeJS.ReadWriteStream) => void
    remove: (stream: NodeJS.ReadWriteStream) => void
    destroy: () => void
}

export type IDisposer = {
    dispose: () => void
}

export type IPatch = {
    op: string
    path: string
    value?: any
    from?: string
}

export class Kek<T> {
    _atom: mobx.Atom = new mobx.Atom
    _multiWriter: NodeJS.WritableStream & IMultiWriteStream | null = null

    @mobx.observable _streams: NodeJS.ReadWriteStream[] = mobx.asFlat([])

    _children: T[] = []
    @mobx.observable _shadow: T[] = []

    _prevChildren: T[] | null = null

    @observed get children(): T[] {
        return this._children
    }

    constructor(children: T[] = []) {
        if (children.length) {
            mobx.transaction(() => {
                children.filter(Boolean).forEach(model => {
                    this.add(model)
                })
            })
        }
    }

    @changed add(value: T): this {
        this._children.push(value)
        this._shadow.push(value)
        return this
    }

    @changed remove(value: T): this {
        const ix = this._children.indexOf(value)
        if (ix > -1) {
            this._children.splice(ix, 1)
            this._shadow.splice(ix, 1)
        }
        return this
    }

    _flush() {
        const current = mobx.toJSON(this.children)
        const prev = this._prevChildren

        const patches = fastjsonpatch.compare(prev, current)

        if (patches.length) {
            debug("emit patch %O (streams len: %d)", patches, this._streams.length)
            if (this._multiWriter) {
                this._multiWriter.write(patches as any)
            }
            this._prevChildren = current
            this._atom.reportObserved()
        }
    }

    observe(fn?: (value: T[], r: IDisposer) => any): NodeJS.ReadWriteStream {
        const tr = through.obj()
        this._streams.push(tr)

        if (this._streams.length === 1 && !this._multiWriter) {
            this._multiWriter = multi.obj([], { autoDestroy: false })
            this._prevChildren = mobx.toJSON(this._children)

            mobx.when(() => {
                const disposed = (this._streams.length === 0)
                if (!disposed) {
                    this._flush()
                }
                return disposed
            }, () => {
                process.nextTick(() => {
                    debug("dispose writer (s: %s)", this._streams.length)
                    if (this._multiWriter) {
                        this._multiWriter.destroy()
                        this._multiWriter = null
                    }
                })
            })
        }

        if (this._multiWriter) {
            this._multiWriter.add(tr)
        }

        let _r: mobx.Lambda

        const ro = readonly(tr)

        eos(ro, (er: any): void => {
            const ix = this._streams.indexOf(tr)
            if (er) {
                return void debug(`stream #%d closed prematurely (er: %s)`, ix, er.message)
            }

            process.nextTick(() => {
                const ix = this._streams.indexOf(tr)
                if (ix !== -1) {
                    debug("dispose stream (%d) (eos)", this._streams.length)

                    this._streams.splice(ix, 1)
                    if (this._multiWriter) {
                        this._multiWriter.remove(tr)
                    }
                }

                if (typeof _r === "function") {
                    debug("dispose observer #%d (eos)", ix)
                    _r()
                }
            })
        })

        if (fn) {
            _r = mobx.autorun(r => {
                fn(this.children, {
                    dispose: () => {
                        this._flush()

                        const ix = this._streams.indexOf(tr)

                        debug("dispose stream (%d) (autorun)", this._streams.length)
                        if (ix !== -1) {
                            this._streams.splice(ix, 1)
                            if (this._multiWriter) {
                                this._multiWriter.remove(tr)
                            }
                        }

                        debug("dispose observer #%d (autorun)", ix)
                        r.dispose()
                    }
                })
            })
        }

        return ro
    }

    applyPatches(patches: IPatch[], validate: boolean = false): this {
        this.batch(() => {
            debug("apply patches %O (validate: %s)", patches, validate)
            fastjsonpatch.apply(this._shadow, patches, validate)
        })
        return this
    }

    batch(fn: () => any): this {
        mobx.transaction(fn)
        return this
    }
}

export function changed(target: any, key: any, descriptor: TypedPropertyDescriptor<any>) {
    const sup = descriptor.set || descriptor.value

    const fn = function(...args: any[]) {
        const res = sup.apply(this, args)
        const self = (this as Kek<any>)
        // debug("report changed (%s)", key)
        self._atom.reportChanged()
        return res
    }

    if (typeof descriptor.set === "function") {
        descriptor.set = fn
    } else if (typeof descriptor.value === "function") {
        descriptor.value = fn
    }

    return descriptor
}

export function observed(target: any, key: any, descriptor: TypedPropertyDescriptor<any>) {
    const sup = descriptor.get || descriptor.value

    function fn() {
        const self = (this as Kek<any>)
        // debug("report observed (%s)", key)
        self._atom.reportObserved()
        return sup.apply(this)
    }

    if (typeof descriptor.get === "function") {
        descriptor.get = fn
    } else if (typeof descriptor.value === "function") {
        descriptor.value = fn
    }

    return descriptor
}
