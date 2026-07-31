# little-internet Lesson 00 — Stage 1 capture instrument

Two-session capture instrument for the amended Stage 1 design
([research/2026-07-11-little-internet-stage-1-amendment.md](../../research/2026-07-11-little-internet-stage-1-amendment.md),
commit `ccda72e`). It implements the amendment's capture and custody contract
v1: pre-run manifest, per-stage ordered event capture with a hash chain,
protected local custody, a fail-closed 72–96 hour delayed-window gate,
rubric-capped review, a bounded de-identified portable package, and logged raw
deletion.

**This instrument authorizes nothing.** Recruitment, scheduling and any real
participant capture remain gated by the separately accepted exact-run
governance packet. Runs without that packet are rehearsal or synthetic method
evidence only, and every result is capped at `review`.

## Boundaries the instrument enforces

- **Prediction lock:** each form response is locked (digest-bound) before any
  command, feedback or conceptual content for that stage.
- **Delayed window:** Form C may only be shown 72–96 h after the Form B lock,
  measured by the local system clock (`local-system-observed`). Too early →
  refused fail-closed, nothing shown. Expired → recorded `missing`
  (`window-expired`), never learner failure.
- **Clock honesty:** `LI_L00_SYNTHETIC_CLOCK_MS` is honored only for
  classification `synthetic`. A live run can never be fast-forwarded; a
  synthetic run can never be relabeled live.
- **Custody:** raw responses live only under the gitignored `.custody/`
  store. The portable package carries opaque references, digests, bounded
  dispositions, assistance events and timings — never raw text, identity,
  consent references or storage paths.
- **Review cap:** without evaluator authority from an accepted governance
  packet, `pass` is recorded as `review` with the cap stated in the record.
- **Deletion:** raw deletion is role-gated and appends a chained deletion
  event; `verify` still validates the chain afterwards.

## Commands

```sh
node instruments/little-internet/capture.mjs start \
  --consent-ref <opaque> --participant-ref <opaque> \
  --retention-policy <version> --trace-file <isolated-trace>   # session A

node instruments/little-internet/capture.mjs assist \
  --run <id> --stage <stageId> --kind language-clarification|navigation-help|facilitator-conceptual|visible-ai|other-observed-help \
  --actor <role> --note "<bounded>" [--contaminates]

node instruments/little-internet/capture.mjs status --run <id>
node instruments/little-internet/capture.mjs resume --run <id>   # session C
node instruments/little-internet/capture.mjs verify --run <id>
node instruments/little-internet/capture.mjs review --run <id> --evaluator-role <role>
node instruments/little-internet/capture.mjs package --run <id> --summary "<de-identified>"
node instruments/little-internet/capture.mjs delete --run <id> --role controller-operator
```

Scripted (`--scripted <json>`) input is always classified `synthetic`.

## Owner rehearsal runbook (prerequisite 2 of the P7-preflight disposition)

The rehearsal executes the exact capture/replay/deletion flow on the owner and
produces digest-bound artifacts. Method evidence only; no P6 credit, no
learning claim.

1. **Synthetic walkthrough (same day).** Run the full chain with scripted
   input and a synthetic clock to demonstrate window refusal, capture,
   tamper detection (`npm run test:instruments` covers this), then once by
   hand end-to-end. Keep the emitted digests.
2. **Live rehearsal, session A (day 0).** `start` with
   `--participant-ref owner-self`, real clock, a real Lesson 00 virtual run at
   `afa93c7`, real terminal trace binding. Confirm `status` reports
   `too-early` immediately afterwards — that refusal is itself rehearsal
   evidence.
3. **Live rehearsal, session C (day 3).** When the real window opens,
   `resume`, then `verify`, `review`, `package`, `delete`, and `verify` again.
   File the two `admin/session-*-root.json` digests plus the deletion log in
   the governance record for the rehearsal.

Whether step 1 alone may stand in for the real-wait steps 2–3 is a founder
adjudication, not an operator choice. The conservative reading of "exact flow"
includes the real wait; with a same-week schedule the real wait costs no
calendar time, because participant scheduling is gated on the governance
packet anyway.

## Real-run sequence (after rehearsal + accepted governance packet)

Session A: consent and screening → `start` (Form A locked before any lesson
output → Lesson 00 virtual at `afa93c7` with assistance logged via `assist` as
it occurs → Form B locked) → `status` to confirm the window. Session C at
72–96 h: `resume` without showing prior answers, transcript or rubric →
`verify` → `review` → `package` → deliver only the consented, de-identified
portable summary. Raw material follows the retention and deletion values of
the accepted governance packet.
