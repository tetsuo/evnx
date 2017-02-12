import test = require("tape")
const memdb = require("memdb")
import {Swarm, normkey} from "../swarm"
import * as fs from "fs"
const sodium = require("sodium") // require("chloride/browser") in browser
const electronRTC = require("electron-webrtc")
const shasum = require("shasum")

const keypair = JSON.parse(fs.readFileSync(__dirname + "/../../../fixtures/keys.json", "utf8"))

test("swarmlog", t => {
    const wrtc = electronRTC()

    type Type = { x: string }

    const publisher = new Swarm<Type>({
        db: memdb(),
        user: "fff",
        wrtc: wrtc,
        sodium: sodium
    })

    const follower = new Swarm<Type>({
        db: memdb(),
        user: "bar",
        wrtc: wrtc,
        sodium: sodium
    })

    const expected = [
        { x: "HELLO-0" },
        { x: "HELLO-1" },
        { x: "HELLO-2" }
    ]

    publisher.join(keypair)

    const normPubKey = shasum(normkey(keypair.public).toString("hex"))

    expected.forEach(d => {
        publisher.send(normPubKey, d) // or publog.append(d)
    })

    setTimeout(() => {
        const sublog = follower.join({ public: keypair.public })
        sublog.createReadStream({ live: true })
            .on("data", (d: any) => {
                t.deepEqual(d.value.data, expected.shift())
                t.equal(d.value.user, "fff")
                if (!expected.length) {
                    t.end()
                    process.nextTick(() => {
                        publisher.part(normPubKey)
                        follower.part(normPubKey)
                        wrtc.close()
                    })
                }
            })
    }, 300)
})
