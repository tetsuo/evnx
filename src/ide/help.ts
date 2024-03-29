import {tag} from "../lang/template"

export const main = `welcome to evnx!

evnx is a decentralized, secure, collaborative projectional editor for building and evaluating Evan programs in real-time. More info here: https://github.com/tetsuo/evnx

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
`Created #${"channel"}

Copy & share one of the following commands with your friends to invite them in:

For read-only access:

  /keychain add ${"public"}

For write access:

  /keychain add ${"public"} ${"private"}

For more information on keychain and public & private keys, type:

  /help keychain
`
