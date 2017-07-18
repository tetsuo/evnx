import test = require("tape")
const memdb = require("memdb")
import {Swarm, normkey} from "../swarm"
import * as fs from "fs"
const sodium = require("sodium") // require("chloride/browser") in browser
const electronRTC = require("electron-webrtc")
const shasum = require("shasum")

const keypair = JSON.parse(fs.readFileSync(__dirname + "/../../../fixtures/keys.json", "utf8"))

const hubs = [ "https://evnx-hub.herokuapp.com" ]
// XXX: do not set this to sdf.party: evanup.io & sdf.party are both hosted on
// the same container. If tests fail then sdf.party will never be deployed and vice-versa (and tests will fail), deep Hofstadter stuff

test("swarmlog", t => {
    const wrtc = electronRTC()

    type Type = { x: string }

    const publisher = new Swarm<Type>({
        db: memdb(),
        user: "fff",
        wrtc: wrtc,
        sodium: sodium,
        hubs: hubs
    })

    const follower = new Swarm<Type>({
        db: memdb(),
        user: "bar",
        wrtc: wrtc,
        sodium: sodium,
        hubs: hubs
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
            .on("error", (er: any) => {
                t.fail(er)
            })
    }, 300)
})
