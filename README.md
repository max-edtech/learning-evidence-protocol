# Learning Evidence Protocol

> A correct answer is like a green link light: it proves that something
> happened, not that understanding is connected end to end.

Learning Evidence Protocol (LEP) is a small, open specification for making a
learning claim observable. It describes what a learner predicts, what they
observe, how they explain the result, and whether they can transfer the idea to
a changed situation.

LEP does **not** try to infer thoughts, replace teachers, or assign a universal
score. It gives lessons and learning tools a shared format for collecting
inspectable evidence.

## See it

- [Interactive reference demo](https://max-edtech.github.io/learning-evidence-protocol/)
- [Protocol specification](./SPEC.md)
- [Lesson contract schema](./schema/lesson-contract.schema.json)
- [Run evidence schema](./schema/run-evidence.schema.json)
- [Networking Lesson 00 example](./examples/networking-lesson-00.contract.json)

## The evidence loop

```text
prediction -> observation -> explanation -> transfer
     |              |              |             |
 what should    what actually   why did it    does the model
 happen?        happened?       happen?       still work?
```

An outcome alone is weak evidence:

```text
answer = correct
```

A trace is inspectable:

```text
claim       = "The learner distinguishes a physical link from IP reachability."
prediction  = "Green link lights do not guarantee that ping will work."
observation = "The interfaces are up, but neither node has an IPv4 address."
explanation = "Layer 1 is established; Layer 3 identity is still missing."
transfer    = "The learner diagnoses the same distinction in a changed setup."
```

## Why this exists

Most learning systems record exposure, activity, and outcomes:

- the learner opened the lesson;
- the learner ran the command;
- the learner submitted an answer;
- the answer was correct.

Those signals matter, but they do not reveal whether the learner's mental model
changed in a useful way. LEP adds an evidence layer without pretending that
understanding can be reduced to one number.

## Repository scope

This repository intentionally contains only:

- the open protocol and JSON Schemas;
- synthetic, non-personal examples;
- a dependency-light validator;
- a static reference viewer.

It does not contain learner data, scoring models, profiles, proprietary
diagnostic logic, production connectors, or commercial analytics. See
[Open-core boundary](./OPEN_CORE_BOUNDARY.md).

## Validate the examples

Requires Node.js 20 or newer.

```bash
npm install
npm test
```

The validator checks every example against the published JSON Schemas.

## Status

`0.1.0-experimental`

The first goal is not adoption at scale. It is to discover whether the same
evidence contract can describe learning in more than one domain without erasing
what makes each domain meaningful.

## Acknowledgements

The first example was inspired by
[`ngrok/little-internet`](https://github.com/ngrok/little-internet), a
reproducible hardware-based project for making networking fundamentals visible.
This repository is independent and is not affiliated with or endorsed by ngrok.
It references the upstream lesson; it does not redistribute its scripts or
packet captures.

## License

Mozilla Public License 2.0. Changes to MPL-covered files remain open when
distributed, while separate files may be combined into larger proprietary
systems.

