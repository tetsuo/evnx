# evan\up [wip]

<todo-description>

Visit [evanup.io](https://evanup.io) to see it in action.

```
npm install evanup
```

[![build status](https://app.wercker.com/status/c007ef99033cffce90bc5fe5efae10d1/s/master "build status")](https://app.wercker.com/project/byKey/c007ef99033cffce90bc5fe5efae10d1)
[![NPM version](https://badge.fury.io/js/evanup.svg)](http://badge.fury.io/js/evanup)

<todo-retro-80s-logo>

# Evan

Evan's language constructs (aka *semantics types*, or *sTypes* for short) are structurally described in [description.json](./description.json) file.

As an example, a `binary operation` definition looks like this:

```json
"binary operation": {
  "properties": {
    "operator": { "type": "string" },
    "left": { "type": "any" },
    "right": { "type": "any" }
  }
}
```

and here is an excerpt from an Evan _program_ that uses this definition:

```
"body": {
  "$sType": "if-then-else",
  "condition": {
    "$sType": "binary operation",
    "operator": "<",
    "left": {
      "$sType": "value reference",
      "name": "n"
    },
    "right": 2
  }
```

For Evan, JSON is chosen as the concrete syntax- because it is a very well-known and supported format, [and it's true.](https://www.youtube.com/watch?v=ELD2AwFN9Nc)

But, of course, *writing* a program in JSON is tedious, uncomfortable and unproductive: after all, we'd be writing ASTs in a verbose form.

# evanup.io

Enter [evanup.io!](https://evanup.io), evanup is a peer to peer, decentralized webrtc client / projectional editor for building evan programs with friends in real-time.

It's built on top of [many](https://github.com/mobxjs/mobx) [amazing](https://github.com/mafintosh/hyperlog) [technologies](https://github.com/Starcounter-Jack/JSON-Patch), which one of them happens to be _Evan_ evaluator itself.

# Execution == Evaluation

Evan "works" by providing the *evaluator* with *any* JSON input, and optionally an object table (external-objects).

The evaluator then tree-transforms this JSON according to the following rules:

* Objects which have a string-valued property `$sType` are processed by their respective evaluation function.
  * This evaluation *never* throws but returns something sensible: either an issue object or `undefined` (which corresponds loosely to e.g. Scala's `None`).
  * The individual evaluation functions determine whether recursion into sub-values of sTyped objects happen.
* All other values (so also objects which are not "sTyped") are returned as-is.

## On type checking

* Evaluation does (some) type checking - which obviously happens at runtime.
* A separate type checker (once it exists) mimics the evaluator but computes and checks typing statically: this should help the developer beyond what's reasonable in terms of unit tests.
* Evan is not statically typed, but could at some point become optionally-typed.

# external Objects

_External Objects_ is Evan's way of interfacing with things outside any Evan program on its own. It's nothing more than a map/dictionary of names to objects, which expose functions. Using the semantics type `object-function invocation`, you can interact with functions on these objects.

# Development

To get started with development, clone this repository and run `npm install` or `yarn`.

<todo>

# Usage

```
evan FILE OPTIONS

Options:

  --semantics    Print TypeScript semantics.
  -v, --version  Show meta-model version.
  -h, --help     Show this message.
```

# License

mit
