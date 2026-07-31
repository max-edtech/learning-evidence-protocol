# Design note: two observations from a three-year-old

Date: 2026-07-08
Status: Design note; no protocol change yet
Covers: a fourth rung for evidence strength; an encoding-richness hypothesis

## Where this came from

Watching my three-year-old daughter acquire language, I can see learning
happening, but I cannot see *how* a word becomes hers. We talk bilingually;
I sometimes drop in words that should be beyond her, and she responds
roughly right — but "roughly right" is a bundle I cannot unpack in the
moment. She may understand the word, or my tone, or the gesture, or the
routine; she may be guessing from bilingual overlap; she may half-own the
concept and lack the means to show it.

This is the protocol's founding constraint in its purest form: **we never
observe understanding directly; we observe evidence around it.**

## The ladder this suggests

Ordered by how hard the evidence is to fake:

1. **Same-session correct response.** Weakest. Tone, context, imitation and
   luck are all still in the bundle.
2. **Elicited transfer (changed case).** The learner is asked to apply the
   idea in a situation that looks different. This is what the
   [Stage 1 pre-registration](2026-07-08-little-internet-stage-1-preregistration.md)
   locks in.
3. **Delayed elicited transfer.** The same, but after time has passed
   (e.g. a ~72-hour check). Rules out same-session momentum.
4. **Spontaneous transfer.** Days later, unprompted, the learner uses the
   concept correctly in a situation nobody staged: hearing "this cup is
   fragile, be gentle" one day, and saying "this is fragile" about
   something new, on her own, another day.

Rung 4 is the strongest evidence there is, precisely because nobody asked.
It is also the hardest to instrument without turning a home or a classroom
into a surveillance apparatus — which the protocol must never do. A
realistic capture path is third-party observation: a teacher or facilitator
logs an unprompted use when they happen to witness one, recorded as its own
evidence type with its own limitation (observation is opportunistic, not
systematic).

LEP currently instruments rungs 1–3. Rung 4 is the north star: not a
required field, but the class of evidence the protocol should leave room
for.

## The reactivity principle

The same observation carries a warning. The reason a three-year-old's
learning looks "permanent" is that words arrive tied to food, movement,
bedtime, laughter, frustration — to life, not to assessment. The moment
observation turns play into testing, it changes what is being learned.

For the protocol this is a design constraint, not a sentiment:

- **Evidence collection must not convert the learning situation into an
  exam.** For young learners especially, a changed case should arrive as
  conversation or play, not as a graded checkpoint.
- If a retention check requires announcing "this is a test", the
  measurement is already distorting the thing it measures. Prefer designs
  where the changed case is a natural next thing to do.

This constraint applies directly to any replication run with elementary
students.

## Second observation: singing beats speaking

The same child acquires language noticeably more durably through song than
through direct speech. Song bundles rhythm, melody, movement and emotion
into one channel; repetition inside a song does not feel like repetition;
and there is no wrong-answer pressure — song is the reactivity principle
implemented by accident.

The generalization worth keeping is not "add music". It is that **the
content was constant while the encoding richness varied**, and the richer
encoding stuck. The formats that survive are the ones where repetition is
intrinsic and stakes are absent.

### Why this matters for lesson modes

`little-internet` declares three modes in its lesson manifest, and they
happen to form an encoding-richness ladder for the *same* causal chain:

| Mode | Encoding |
|---|---|
| hardware | embodied: real cables, blinking link lights, hands |
| virtual | symbolic: the same chain as terminal interaction |
| read_only | narrative: the chain as text |

**Hypothesis (stated before any cross-mode run):** same-session completion
may look identical across modes, while delayed evidence (rung 3) and
spontaneous transfer (rung 4) stratify by encoding richness. If retention
in virtual mode matches hardware, that is direct evidence for the scalable
MVP shape; if it does not, the gap measures what the body was carrying.
Either result is useful, and only delayed, changed-context evidence can
tell them apart — rung 1 cannot see this difference at all.

A smaller, related observable for retention checks: a lesson's causal chain
is itself a melody. Learners may retain the story ("the lights were green
but they couldn't talk until they had names") while losing the commands, or
the reverse. Retention checks should ask for **re-narration before command
recall**, so the two forms of survival can be told apart.

## Boundary

One parent watching one child is a lens, not data. Nothing in this note is
a claim; no family observation will appear as evidence in this repository.
The note exists because the lens is clarifying: it says what the strongest
evidence looks like, what measurement must never cost, and which hypothesis
the cross-mode question should carry.
