export const STATUS = "!status"
export const INFO = "!info"
const VERSION = "2"
export const DB = "r2." + VERSION
export const KEYCHAIN = "!!ident"
export const NONE = "none"

const randomBytes = require("randombytes")
const cl = require("chloride")

export function getRandomString(n: number = 3) {
    return randomBytes(n).toString("hex")
}

export function collapseWhiteSpace(s: string) {
    return s.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
}

export function stripUrlHash(hash: string) {
    return hash.replace(/[^0-9a-z]/gi, "")
}

export const statusKeyPair = { id: STATUS, public: "" }

export namespace sodium {
    export const curves = [ "es25519" ]

    export function generate(seed: Buffer) {
        if (!seed) {
            cl.randombytes(seed = new Buffer(32))
        }

        const keys = seed
            ? cl.crypto_sign_seed_keypair(seed)
            : cl.crypto_sign_keypair()

        return {
            curve: "ed25519",
            public: keys.publicKey,

            // so that this works with either sodium
            // or libsodium-wrappers (in browser)
            private: keys.privateKey || keys.secretKey
        }
    }

    // export function sign(secret, message) {
    //     return cl.crypto_sign_detached(message, secret)
    // }

    // export function verify(pub, sig, message) {
    //     return cl.crypto_sign_verify_detached(sig, message, pub)
    // }
}

// had to copy-paste ssb-keys here, uglify-js throws with the original module
export namespace ssbkeys {
    function tag(key: any, tag: any) {
        if (!tag) {
            throw new Error("no tag for:" + key.toString("base64"))
        }
        return key.toString("base64") + "." + tag.replace(/^\./, "")
    }

    export function hash(data: any, enc: any) {
        data = (
            "string" === typeof data && enc === null
                ? new Buffer(data, "binary")
                : new Buffer(data, enc)
        )
        return cl.crypto_hash_sha256(data).toString("base64") + ".sha256"
    }

    export function keysToJSON(keys: any, curve: any) {
        curve = (keys.curve || curve)

        const pub = tag(keys.public.toString("base64"), curve)

        return {
            curve: curve,
            public: pub,
            private: keys.private ? tag(keys.private.toString("base64"), curve) : undefined,
            id: "@" + (curve === "ed25519" ? pub : exports.hash(pub))
        }
    }

    export const curves = {
        ed25519: sodium
    }

    // this should return a key pair:
    // {curve: curve, public: Buffer, private: Buffer}

    export function generate(curve?: any, seed?: any) {
        curve = curve || "ed25519"

        if (!curves[curve]) {
            throw new Error("unknown curve:" + curve)
        }

        return keysToJSON(curves[curve].generate(seed), curve)
    }
}
