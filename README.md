# evnx

a secure, peer-to-peer, decentralized projectional editor for building and evaluating Evan programs in real-time.

[![NPM version](https://badge.fury.io/js/evnx.svg)](http://badge.fury.io/js/evnx)

# introduction

`evnx` is currently in development.

Having said that, you can see the final build in action here. Enjoy!

**Documentation is coming soon**

*todo-retro-80s-logo*

# evaluation of abstract nodes

The Evan language is implemented by means of an *evaluator*, which transforms JSON to JavaScript, and it is said to be a *Lispy* language in the context of JavaScript. (I'm hoping Meinte will explain this.)

It's in principle *functional* (evaluating the same piece of JSON will always lead to the same result), further, the evaluation is wired to happen *incremental* (using [mobx](https://github.com/mobxjs/mobx)), so the subsequent updates will only require a partial re-evaluation.

## language

Evan's language constructs are structurally described in [description.json](./description.json) file.

As an example, a `binary operation` definition looks like this when JSON is used as concrete syntax:

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

You can optionally provide an external object table to the evaluator.

The evaluator will then transform those objects according to the following rules:

* Objects which have a string-valued property `$sType` are processed by their respective evaluation function.
  * This evaluation *never* throws but returns something sensible: either an issue object or `undefined` (which corresponds loosely to e.g. Scala's `None`).
  * The individual evaluation functions determine whether recursion into sub-values of sTyped objects happen.
* All other values (so also objects which are not "sTyped") are returned as-is.

_External Objects_ is Evan's way of interfacing with things outside any Evan program on its own. It's nothing more than a map/dictionary of names to objects, which expose functions. Using the semantics type `object-function invocation`, you can interact with functions on these objects.

## On type checking

* Evaluation does (some) type checking - which obviously happens at runtime.
* A separate type checker (once it exists) mimics the evaluator but computes and checks typing statically: this should help the developer beyond what's reasonable in terms of unit tests.
* Evan is not statically typed, but could at some point become optionally-typed.

# CLI usage

```
evnx FILE OPTIONS

Options:

  --semantics    Print TypeScript semantics.
  -v, --version  Show meta-model version.
  -h, --help     Show this message.
```

# development

Install dependencies and start the development server:

```
yarn
npm run test
npm run ide
```
