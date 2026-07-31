# Stage 1 amendment: adult external field-method preflight for Lesson 00

Date: 2026-07-11
Status: **Amended before data; no learner run has been performed**
Amends: [2026-07-08 Stage 1 pre-registration](2026-07-08-little-internet-stage-1-preregistration.md)
Upstream: [`ngrok/little-internet`](https://github.com/ngrok/little-internet)
`main` @ `afa93c7`

## Why this amendment exists

Founder review changed the first external participant to one consenting adult
beginner and required a T0 form, a 72–96 hour fresh transfer probe, a frozen
rubric, and capture/custody rules that bind evidence before interpretation.

The original pre-registration remains in Git history. This amendment records
every material change before participant recruitment, scheduling, exposure, or
data collection. It is a design instrument, not consent, controller acceptance,
outreach authorization, or permission to run.

## What changes and what does not

### Changed by this amendment

1. The participant is one consenting **adult** beginner, not an elementary or
   senior-high student.
2. Prior networking and prior Lesson 00/form exposure are screened before the
   run. Coding background is recorded but is not an eligibility requirement.
3. The canonical assistance condition is `uncontrolled`. Language,
   navigation, facilitator and visible-AI help are timestamped events, not new
   assistance modes.
4. A direct T0 response is locked before lesson output or conceptual feedback.
5. A fresh delayed transfer form is scheduled for 72–96 hours.
6. The claim, forms, rubric and capture/custody contract below are frozen.
7. Raw evidence remains in protected custody. No human `n=1` record is promised
   to the public `examples/` directory.

### Preserved from the original pre-registration

1. Lesson 00 virtual mode at upstream commit `afa93c7`.
2. One participant and one bounded networking claim.
3. The locked immediate changed case: two directly connected, link-up
   interfaces assigned to different `/24` IPv4 prefixes with no router/static
   route.
4. Prediction is locked before diagnostic commands.
5. Completion is operational evidence, not evidence of understanding.
6. Ambiguous evidence remains `review`.
7. The original “first few learners” prediction is not adjudicated by one
   participant. This run contributes one observation only.

## Bounded claim

The strongest result this run may support is:

> Under an `uncontrolled` assistance condition with observed assistance events
> recorded, one adult beginner produced a locked prediction and causal
> diagnosis that two directly connected, link-up interfaces assigned to
> different on-link IPv4 prefixes have no direct IPv4 reachability without a
> route/router, and re-derived the same bounded condition on a fresh case
> 72–96 hours later.

This claim is limited to the observed participant, forms, assistance condition,
lesson commit, evaluator and time window. It is not a claim of mastery,
course effectiveness, unaided ability, enterprise-population validity, or an
AI effect.

## Eligibility and stop conditions

The participant must:

- be an adult capable of informed consent;
- report no prior networking instruction sufficient to explain direct on-link
  IPv4 reachability;
- not have seen Lesson 00, this amendment, the forms below, or their answers;
- be available for the 72–96 hour fresh probe;
- understand that participation is voluntary and unrelated to course,
  employment, compensation, or relationship standing.

Do not schedule or start the run unless:

- an accountable controller/operator has accepted the exact-run obligations;
- consent, retention, deletion, withdrawal, access, backup and incident terms
  contain real approved values;
- protected storage is ready;
- an owner-only rehearsal has completed the same
  capture → replay → export-minimization → deletion flow;
- the evaluator/content reviewer and rubric version are named;
- the forms and capture instrument can be bound before exposure.

Any failed entry condition stops the run. It does not become learner failure.

## Assistance condition and event vocabulary

Canonical assistance condition: `uncontrolled`.

Required limitation: external AI, people and off-surface resources are not
fully observable. The run must not be described as unaided.

Observed events use this local research vocabulary:

- `language-clarification` — literal translation or wording clarification;
- `navigation-help` — locating a terminal, file or next interface control;
- `facilitator-conceptual` — any networking explanation or hint;
- `visible-ai` — AI output visibly requested or shown during the run;
- `other-observed-help` — other witnessed assistance with a bounded note.

Every observed event records stage, time, actor role and a bounded description.
This vocabulary is event provenance only; it does not extend LEP's canonical
assistance modes.

If conceptual help reveals a scored answer before `response-locked`, that stage
is contaminated and cannot pass. Missing assistance telemetry never proves no
assistance occurred.

## Frozen form A — T0 diagnosis

### Setup shown to the participant

Two directly connected virtual interfaces are `UP` and link-local traffic is
visible, but neither interface has an IPv4 address. No Lesson 00 output or
causal explanation has been shown.

### Prompt

> Before running a command: should IPv4 ping to `10.10.0.2` work in this state?
> What condition would you inspect first, and why might a live link still be
> insufficient?

### Capture rule

Lock the participant's direct response before commands, feedback, AI output or
conceptual help. T0 records a baseline; it is not scored as retained learning.

## Bounded intervention

Run little-internet Lesson 00 in virtual mode at `afa93c7`.

- Navigation and literal language clarification are permitted and logged.
- Conceptual explanations are not volunteered before the participant's own
  explanation step.
- Visible AI use is permitted and logged; external AI remains unobservable.
- Lesson completion and system output never substitute for a learner response.

## Frozen form B — immediate changed case

This is unchanged from the 2026-07-08 pre-registration.

### Setup shown to the participant

After Lesson 00, reset the lab. Assign `10.10.0.1/24` to one directly connected
endpoint and `10.20.0.2/24` to the other. Both interfaces are `UP`. There is no
router, gateway or added static route. Ping fails.

### Prompt

> Before running a command: will these endpoints have direct IPv4 reachability?
> Explain why everything can look connected while ping still fails. Then name
> the first diagnostic check you would run.

### Capture rule

Lock prediction and explanation before diagnostic commands or feedback. Bind
the subsequent isolated terminal/system trace separately.

## Frozen form C — delayed fresh transfer

Administer 72–96 hours after the immediate form without showing the prior
answer, transcript or rubric.

### Setup shown to the participant

Two directly connected virtual interfaces are `UP`. Endpoint A is
`192.0.2.10/25`; endpoint B is `192.0.2.200/25`. There is no router, gateway or
added static route.

### Prompt

> Before running a command: should these endpoints have direct IPv4
> reachability? Explain the relevant network condition and what you would check
> first. Do not rely on remembering the earlier addresses.

### Capture rule

Lock prediction and causal explanation before commands or feedback. A missing,
late, near-copy-contaminated or prematurely revealed probe is `not-run` or
`review`, never learner failure and never retention evidence.

## Frozen rubric v1

The evaluator applies the rubric to Forms B and C independently. Equivalent
plain-language explanations are acceptable; vocabulary alone is not.

All four conditions are required for a bounded form-level pass:

1. **Prediction:** says direct IPv4 reachability should fail in the stated
   no-router/no-static-route topology.
2. **Location:** locates the relevant failure at IPv4 addressing, on-link
   prefix or route selection rather than physical/link state.
3. **Causal explanation:** explains that each endpoint treats the peer as
   off-link and no route/router exists to forward traffic.
4. **Diagnostic priority:** checks IPv4 address/prefix and route state before
   latency, restart, application or physical replacement.

Disposition rules:

- `pass` — all four conditions are directly supported by the locked response;
- `fail` — a named evaluator confirms one or more conditions were not met;
- `review` — language is ambiguous, evidence is contaminated, evaluator
  authority is incomplete, or sources conflict;
- `not-run` — the required response does not exist.

The evaluator record must bind evaluator role, rubric version, time and the
exact response digest. Without the named/authorized review required by the
governance packet, results remain capped at `review`.

## Capture and custody contract v1

### Pre-run binding

Before the first prompt, create a run manifest containing:

- opaque run ID;
- protected consent-attestation reference;
- controller/operator and capture-operator roles;
- lesson ID, virtual mode and upstream commit;
- this amendment's exact commit or file digest;
- form and rubric identifiers;
- `uncontrolled` assistance condition and event-vocabulary version;
- delayed window;
- capture software/version and clock source;
- retention/deletion policy version and protected-store class.

Do not place participant identity, readable identifiers, credentials or raw
storage paths in portable evidence.

### Ordered event capture

For each stage:

1. append `prompt-presented` with prompt digest and wall/monotonic timestamps;
2. collect the direct participant response;
3. append `response-locked` with response artifact digest;
4. only then expose commands, observations, feedback or AI output;
5. append observed assistance/facilitator events as they occur;
6. bind relevant isolated terminal/system artifacts by digest;
7. close with explicit missingness or contamination state.

Each event binds the previous event digest. At session close, store the root
digest in the protected run record and a separately timestamped protected
administrative record. Preserve the limitation:
`single-operator custody; no independent capture attestation`.

### Raw custody

Raw protected material includes consent/identity mapping, direct responses,
raw questions, terminal transcript, assistance events and evaluator working
notes. Access, retention, backup, withdrawal, deletion and incident handling
must follow the separately approved exact-run governance packet.

No raw learner artifact, transcript, recording, screenshot, internal storage
path or readable identifier enters this repository.

### Portable and lesson-author output

A portable record may contain only opaque references, version/digest bindings,
bounded stage dispositions, evaluator provenance, assistance limitations and a
consented de-identified summary.

The lesson author may receive consented de-identified stall points and
paraphrased questions. Direct quotations require separate explicit permission.
No public human evidence record is promised under `examples/`; any future
publication requires its own review and authorization.

## Interpretation and null results

- Completion plus immediate failure shows that this changed case distinguished
  command execution from the bounded causal diagnosis for this participant.
- Immediate pass plus delayed failure shows the response did not survive this
  declared fresh window.
- Immediate and delayed pass support one bounded observation only.
- Missing delayed evidence is missing, not failure.
- Capture/replay/deletion failure is an instrumentation result, not a learner
  result.
- No `n=1` result establishes course effectiveness, enterprise validity,
  population generalization, mastery or an AI effect.

## Remaining authorization boundary

This amendment freezes a design. It does not identify or accept the data
controller, choose retention/deletion values, approve consent, name the final
evaluator, contact a participant, schedule a run, collect data, or authorize
publication.
