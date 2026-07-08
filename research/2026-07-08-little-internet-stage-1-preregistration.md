# Stage 1 pre-registration: first genuine-beginner run of Lesson 00

Date: 2026-07-08
Status: Pre-registered; the run has **not** been performed
Upstream: [`ngrok/little-internet`](https://github.com/ngrok/little-internet) `main` @ `afa93c7`
(first upstream commit range with `lessons/00/manifest.json`, schema_version 1)

## Why this document exists

This design is committed **before** the run so it cannot drift after seeing
data. LEP holds its own claims to the same standard it asks of learner
claims: prediction locked first, observation second.

## Research questions

**Primary — the lesson author's question.** Can someone completely without
context follow Lesson 00 at all? Where do they stall, and what do they ask?
Their verbatim questions are the design signal for lesson 01.

**Secondary — the protocol's question.** Does "completed every command"
survive a changed case? Completion is a green link light: it proves
something happened, not that understanding is connected end to end.

## Learner

- One genuine beginner: an elementary or senior-high student with **no prior
  networking or coding exposure**.
- English is not the learner's first language. Language help is recorded as
  its **own assistance category** so it cannot contaminate the
  where-do-beginners-stall signal.
- Informed consent, with guardian consent if the learner is a minor. All
  identifying data is removed before anything leaves the capture machine.

## Environment

- **Virtual mode** as declared by `lessons/00/manifest.json`; the mode field
  in the evidence record is taken directly from the manifest.
- Host: Apple Silicon macOS, Colima virtualization (same rig as the
  [Phase 0 runs](2026-06-30-little-internet-phase-0-rerun.md)).

## Assistance policy

- The facilitator may answer navigation and language questions; **every
  intervention is logged**.
- Conceptual explanations are not volunteered before the learner's own
  explanation step.
- AI assistants are **not banned**. Any AI use is recorded as assistance
  data, not treated as a violation. The changed case — not prohibition — is
  what separates "understood it" from "was carried through it".

## Locked prediction (the falsifiable bet)

Across the first few learners, we expect **at least one** to complete every
command and still fail the changed case. If this never happens, the protocol
is over-built for this lesson, and that conclusion will be reported with the
same prominence as a confirmation.

## Changed case (locked before the run)

After the learner completes the lesson (link up → same-subnet IPv4 → ARP →
ping succeeds), the facilitator resets the lab and assigns addresses in
**different /24 subnets** (e.g. `10.10.0.1/24` and `10.20.0.2/24`). Both
interfaces are up; ping fails.

1. **Predict first:** before touching any command, the learner states why
   ping might fail when "everything is connected".
2. **Then diagnose:** the learner may run commands to check the prediction.

**Success criterion:** the learner locates the failure at Layer 3 identity —
that same-subnet addressing, not the cable or the link state, is what
created reachability. Reaching for latency, hardware, or restarts first —
the same stumble recorded in the founder's own
[Phase 0 rerun](2026-06-30-little-internet-phase-0-rerun.md) — counts as
not surviving the changed case.

## Evidence handling

- The trace is recorded against the
  [run-evidence schema](../schema/run-evidence.schema.json); ambiguous
  evidence stays `review` and is never auto-promoted to "understood".
- **Deliverable A (to the lesson author):** stall points and anonymized
  excerpts of the learner's questions.
- **Deliverable B (to LEP):** the anonymized evidence record, published
  under `examples/`.

## Out of scope

- One learner answers "is this question worth pursuing" — nothing more.
- Retention over time (e.g. a ~72-hour delayed check) belongs to a later
  replication, and its target should be co-designed with the lesson author
  around what lesson 01 assumes a learner retained.
- The learner is a student of the facilitator; selection and
  eagerness-to-please effects are acknowledged as limitations.
- Results from this education-context run say nothing about other domains.
