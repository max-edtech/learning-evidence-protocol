# Learning Evidence Protocol 0.1

Status: experimental draft

## 1. Purpose

LEP represents evidence for a bounded learning claim. It separates four things
that are often collapsed into a single correctness score:

1. **Prediction** — what the learner expects before the result is known.
2. **Observation** — what the learner identifies in the resulting system state.
3. **Explanation** — the causal account connecting prediction and observation.
4. **Transfer** — use of the same model in a materially changed situation.

The protocol consists of two documents:

- a **lesson contract**, written by a lesson designer;
- a **run evidence record**, produced during one learner's attempt.

## 2. Design principles

### Evidence before inference

Record what happened and what was said before assigning labels. A system may
recommend review, but the raw evidence should remain inspectable.

### Claims must be bounded

"Understands networking" is not testable. "Distinguishes physical link state
from IP reachability in a two-node network" is bounded enough to observe.

### Correct output is necessary but insufficient

Correctness may be one artifact in a trace. It is not a substitute for causal
explanation or transfer.

### Uncertainty must be explicit

`review` is a valid status. Implementations must not silently convert missing or
ambiguous evidence into `pass`.

### Provenance is part of the evidence

Source lesson, version, environment, timestamps, evaluator, and known
limitations should travel with the record.

### Data minimization

The protocol does not require names, email addresses, biometrics, demographic
attributes, or free-form surveillance data. Implementations should collect the
minimum evidence needed for the stated learning claim.

## 3. Lesson contract

A lesson contract declares:

- `protocolVersion`
- `lessonId`
- `title`
- `learningClaim`
- `scenario`
- `evidenceStages`
- `successRule`
- `provenance`

Each evidence stage has:

- a stable `id`;
- one of the four evidence `kind` values;
- a learner-facing `prompt`;
- an `expectedEvidence` description;
- an `evaluation` rule;
- optional system artifacts or limitations.

The JSON Schema is normative:
[`schema/lesson-contract.schema.json`](./schema/lesson-contract.schema.json).

## 4. Run evidence

A run evidence record binds observations to one versioned lesson contract. It
contains:

- a non-identifying `runId`;
- execution environment and source revision;
- one record for every evidence stage;
- artifact references;
- stage statuses;
- a summary and limitations.

Valid stage statuses are:

- `pass`
- `fail`
- `review`
- `not-run`

The JSON Schema is normative:
[`schema/run-evidence.schema.json`](./schema/run-evidence.schema.json).

## 5. Evaluation boundary

LEP standardizes evidence interchange, not pedagogy or universal grading.
Different domains may use different evaluation methods:

- deterministic system assertions;
- a teacher rubric;
- peer review;
- a later transfer task;
- a combination of human and automated checks.

An implementation should preserve which method produced each judgment.

## 6. Versioning

Protocol versions use semantic versioning once the specification reaches
`1.0.0`. During the `0.x` period, any minor release may contain breaking schema
changes.

Lesson contracts and run evidence records must declare the protocol version
they use. Consumers should reject unsupported major versions rather than guess.

## 7. Non-goals

LEP is not:

- a learner surveillance standard;
- a universal intelligence or mastery score;
- an AI tutor;
- a replacement for domain experts or teachers;
- a requirement to publish learner data;
- a claim that internal mental states are directly observable.

It is a compact way to state what evidence would make a learning claim more or
less defensible.

