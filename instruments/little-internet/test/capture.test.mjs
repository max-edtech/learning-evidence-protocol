// SPDX-License-Identifier: MPL-2.0
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const tmpRoot = mkdtempSync(path.join(os.tmpdir(), "li-l00-test-"));
process.env.LI_L00_CUSTODY_ROOT = path.join(tmpRoot, "custody");

const {
  AMENDMENT_COMMIT,
  CONTRACT_PATH,
  DELAY_HOURS,
  WINDOW_HOURS,
  buildPackage,
  clockFor,
  deleteRawResponses,
  logAssist,
  resumeRun,
  reviewRun,
  runStatus,
  startRun,
  verifyRun
} = await import("../capture.mjs");

const HOUR_MS = 3_600_000;
const T0 = Date.parse("2026-07-25T09:00:00.000Z");

const scriptedSessionA = path.join(tmpRoot, "session-a.json");
writeFileSync(
  scriptedSessionA,
  JSON.stringify({
    "form-a.t0-baseline":
      "No - the link being up does not mean ping works; I would check whether either side has an IPv4 address.",
    "observe.trace": "$ ip addr add ...\n$ ping 10.10.0.2\n64 bytes from 10.10.0.2",
    "observe.lesson-00-virtual":
      "Participant completed the command sequence; stalled twice at address assignment.",
    "form-b.immediate-changed-case":
      "No reachability - the two ends sit on different /24 prefixes with no router; each treats the other as off-link. First check: ip addr / prefix."
  })
);
const scriptedFormC = path.join(tmpRoot, "form-c.json");
writeFileSync(
  scriptedFormC,
  JSON.stringify({
    "form-c.delayed-fresh-transfer":
      "The /25 mask splits 192.0.2.x into two halves; .10 and .200 are on different subnets with no router, so no direct reachability. Check prefixes first."
  })
);
const scriptedReview = path.join(tmpRoot, "review.json");
writeFileSync(
  scriptedReview,
  JSON.stringify({
    "form-b.immediate-changed-case": { disposition: "pass", note: "all four rubric conditions present" },
    "form-c.delayed-fresh-transfer": { disposition: "pass", note: "fresh case handled with the same causal model" }
  })
);

function atClock(ms) {
  process.env.LI_L00_SYNTHETIC_CLOCK_MS = String(ms);
}

test("contract validates against the LEP lesson-contract schema", async () => {
  const { default: Ajv2020 } = await import("ajv/dist/2020.js");
  const { default: addFormats } = await import("ajv-formats");
  const lepRoot = path.resolve(path.dirname(CONTRACT_PATH), "..", "..");
  const schema = JSON.parse(
    readFileSync(path.join(lepRoot, "schema", "lesson-contract.schema.json"), "utf8")
  );
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));
  assert.equal(validate(contract), true, JSON.stringify(validate.errors, null, 2));
  assert.equal(contract.evidenceStages[0].kind, "prediction");
  assert.match(contract.provenance.sourceCommit, new RegExp(AMENDMENT_COMMIT));
});

test("full synthetic lifecycle: window gate, chain, review cap, package, delete", async () => {
  atClock(T0);
  const started = await startRun({
    consentRef: "consent-att-0001",
    participantRef: "participant-opaque-01",
    retentionPolicyVersion: "packet-draft-2026-07-22",
    classification: "synthetic",
    scriptedPath: scriptedSessionA
  });
  const { runId, window } = started;
  assert.equal(
    Date.parse(window.t1NotBefore) - T0,
    DELAY_HOURS * HOUR_MS,
    "window opens exactly +72h from the Form B lock"
  );
  assert.equal(
    Date.parse(window.expiresAt) - T0,
    (DELAY_HOURS + WINDOW_HOURS) * HOUR_MS
  );

  logAssist({
    runId,
    stageId: "observe.lesson-00-virtual",
    kind: "navigation-help",
    actorRole: "facilitator",
    note: "pointed to the terminal tab; no networking content"
  });

  // fail-closed: the delayed form may not be shown before the window opens
  atClock(T0 + 1 * HOUR_MS);
  assert.equal(runStatus(runId).decision, "too-early");
  await assert.rejects(
    () => resumeRun({ runId, scriptedPath: scriptedFormC }),
    /window-too-early/
  );

  // window open: Form C locks
  atClock(T0 + 80 * HOUR_MS);
  assert.equal(runStatus(runId).decision, "open");
  const resumed = await resumeRun({ runId, scriptedPath: scriptedFormC });
  assert.equal(resumed.captured, true);
  assert.equal(runStatus(runId).decision, "captured");

  const verified = verifyRun(runId);
  assert.equal(verified.chain, "verified");
  assert.equal(verified.responses["form-b.immediate-changed-case"], "verified");

  // without an accepted governance packet, pass is capped at review
  const review = await reviewRun({
    runId,
    evaluatorRole: "founder-evaluator",
    scriptedPath: scriptedReview
  });
  assert.equal(review.capped, true);
  for (const record of review.records) {
    assert.equal(record.disposition, "review");
    assert.match(record.basis, /capped/);
  }

  const pkg = buildPackage({
    runId,
    summary: "Adult beginner completed commands; changed-case reasoning under review."
  });
  const pkgText = JSON.stringify(pkg);
  const scripted = JSON.parse(readFileSync(scriptedSessionA, "utf8"));
  for (const rawText of Object.values(scripted)) {
    assert.equal(
      pkgText.includes(rawText),
      false,
      "no raw response text may enter the portable package"
    );
  }
  assert.equal(
    pkgText.includes("participant-opaque-01"),
    false,
    "no participant reference may enter the portable package"
  );
  assert.equal(pkgText.includes("consent-att-0001"), false);
  assert.equal(pkg.assistanceEvents.length, 1);
  assert.equal(pkg.stages.length, 4);
  for (const stage of pkg.stages.filter((s) => s.responseSha256)) {
    assert.equal(typeof stage.responseLatencyMs, "number");
  }
  assert.ok(pkg.limitations.some((l) => /capped at review/.test(l)));

  const deletion = deleteRawResponses({ runId, role: "controller-operator" });
  assert.equal(deletion.deleted.length, 4);
  const afterDelete = verifyRun(runId);
  assert.equal(afterDelete.responses["form-c.delayed-fresh-transfer"], "raw-deleted");
});

test("expired window is recorded as missing, never as learner failure", async () => {
  atClock(T0);
  const { runId } = await startRun({
    consentRef: "consent-att-0002",
    participantRef: "participant-opaque-02",
    retentionPolicyVersion: "packet-draft-2026-07-22",
    classification: "synthetic",
    scriptedPath: scriptedSessionA
  });
  atClock(T0 + 100 * HOUR_MS);
  const resumed = await resumeRun({ runId, scriptedPath: scriptedFormC });
  assert.equal(resumed.decision, "expired");
  assert.equal(resumed.captured, false);

  const review = await reviewRun({
    runId,
    evaluatorRole: "founder-evaluator",
    scriptedPath: scriptedReview
  });
  const formC = review.records.find(
    (r) => r.stageId === "form-c.delayed-fresh-transfer"
  );
  assert.equal(formC.disposition, "not-run");

  const pkg = buildPackage({ runId, summary: "Delayed probe missed its window." });
  const transfer = pkg.stages.find(
    (s) => s.stageId === "form-c.delayed-fresh-transfer"
  );
  assert.equal(transfer.state, "missing");
  assert.equal(transfer.reason, "window-expired");
  assert.equal(transfer.disposition, "not-run");
});

test("chain tampering is detected", async () => {
  atClock(T0);
  const { runId } = await startRun({
    consentRef: "consent-att-0003",
    participantRef: "participant-opaque-03",
    retentionPolicyVersion: "packet-draft-2026-07-22",
    classification: "synthetic",
    scriptedPath: scriptedSessionA
  });
  const chainFile = path.join(
    process.env.LI_L00_CUSTODY_ROOT,
    runId,
    "chain.ndjson"
  );
  const lines = readFileSync(chainFile, "utf8").trim().split("\n");
  const target = JSON.parse(lines[2]);
  target.body = { ...target.body, responseSha256: "0".repeat(64) };
  lines[2] = JSON.stringify(target);
  writeFileSync(chainFile, `${lines.join("\n")}\n`);
  assert.throws(() => verifyRun(runId), /chain-broken/);
});

test("a live run can never be fast-forwarded with a synthetic clock", () => {
  atClock(T0);
  assert.throws(() => clockFor("live"), /clock-policy/);
  delete process.env.LI_L00_SYNTHETIC_CLOCK_MS;
  assert.equal(clockFor("live")().clockSource, "local-system-observed");
});
