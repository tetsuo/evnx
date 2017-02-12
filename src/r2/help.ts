import {tag} from "../template"

export const main = `welcome to evan-r2!

evan-r2 is a peer to peer, decentralized webrtc client for building evan programs with friends in real-time.

Commands work like IRC:

  /join #program
  /part #program
  /nick whatever
  /keychain add pubkey [privkey]
  /keychain rm #program
  /init

Once you're in a channel, type messages like normal.

If you're not sure what to do, type:

  /init

For more information on a <cmd>, type:

  /help <cmd>
`

export const init = tag
`Joined #${"channel"}.

Read-only access:

  /keychain add ${"public"}

Write access:

  /keychain add ${"public"} ${"private"}
`
