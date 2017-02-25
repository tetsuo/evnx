const debug = require("debug")("evan:r2:keychain")
const shasum = require("shasum")
import {IKeyPair, normkey} from "../net/swarm"

export type IIndexedKeyPair = IKeyPair & { id: string }

export class Keychain {
    constructor(public db: LevelUp) {}

    put(keypair: IKeyPair, cb: (er: any, sum?: string) => void): string | null {
        let pub: string | null = null

        try {
            pub = normkey(keypair.public).toString("hex")
        } catch (e) {
            debug("could not normalize pubkey: %s", keypair.public)
            cb(new Error(`${e.message}: ${keypair.public}`))
            return null
        }

        const id = shasum(pub)
        const keys = {
            public: keypair.public,
            private: keypair.private
        } // make sure sodium-generated 'id' property is not passed in

        this.db.put(id, keys, (er: any) => {
            if (er) {
                debug("put failed: %s", er.message)
                cb(er)
                return
            }

            debug("updated keychain: %s", id)
            cb(er, id)
        })

        return id
    }

    get(id: string, cb: (er: any, res: IKeyPair) => void): void {
        this.db.get(id, cb)
    }

    del(id: string, cb: (er: any) => void): void {
        this.db.del(id, cb)
    }

    list(cb: (er: any, res: IIndexedKeyPair[]) => void): void {
        const rs = this.db.createReadStream()
        const result: IIndexedKeyPair[] = []
        rs.on("data", (data: { key: string, value: IKeyPair }) => {
            result.push({
                id: data.key,
                public: data.value.public,
                private: data.value.private
            })
        })
        rs.on("end", () => { cb(null, result) })
        rs.on("error", cb)
    }
}
