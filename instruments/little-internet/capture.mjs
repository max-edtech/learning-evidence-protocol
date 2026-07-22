#!/usr/bin/env node
// SPDX-License-Identifier: MPL-2.0
//
// Two-session capture instrument for the little-internet Lesson 00 Stage 1
// amended design (research/2026-07-11-little-internet-stage-1-amendment.md,
// commit ccda72e). It implements the amendment's capture and custody contract
// v1 natively:
//
//   start   session A: manifest -> Form A locked -> Lesson 00 observed ->
//           Form B locked -> delayed window computed and persisted
//   assist  append an observed assistance event (bounded vocabulary)
//   status  wall-clock window decision for the delayed form
//   resume  session C: fail-closed window gate -> Form C locked
//   verify  recompute the whole digest chain and raw-response digests
//   review  evaluator applies rubric v1; results are capped at review unless
//           the manifest carries evaluator authority from an accepted
//           governance packet
//   package bounded portable record: opaque refs, digests, dispositions,
//           assistance events, stall timings - never raw responses
//   delete  role-gated deletion of raw responses with a chained deletion log
//
// Honesty boundaries (mirrors the Program's clock policy):
//   - The clock is the local system clock, recorded as
//     `local-system-observed`; it is not trusted server time.
//   - A synthetic clock (LI_L00_SYNTHETIC_CLOCK_MS) is honored only for
//     classification `synthetic`. A synthetic run can never be relabeled
//     live, and a live run can never be fast-forwarded.
//   - The delayed window (72-96h) comes from the amendment, never from flags.
//
// No raw learner artifact, transcript, storage path or readable identifier
// leaves the custody store. The portable package carries opaque references
// and digests only.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
  appendFileSync
} from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import process from "node:process";
import { createInterface } from "node:readline/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const lepRoot = path.resolve(here, "..", "..");

export const INSTRUMENT = {
  name: "li-l00-capture",
  version: "0.1.0"
};
export const CONTRACT_PATH = path.join(here, "lesson-00-stage1.contract.json");
export const AMENDMENT_PATH = path.join(
  lepRoot,
  "research",
  "2026-07-11-little-internet-stage-1-amendment.md"
);
export const AMENDMENT_COMMIT = "ccda72e707250fdd8ae68e7c6e09eed179f6c67c";
export const UPSTREAM_COMMIT = "afa93c7";
// Custody lives in a gitignored store; LI_L00_CUSTODY_ROOT exists for test
// isolation only and never changes what may enter the portable package.
export const CUSTODY_ROOT =
  process.env.LI_L00_CUSTODY_ROOT ?? path.join(lepRoot, ".custody", "li-l00");
export const DELAY_HOURS = 72;
export const WINDOW_HOURS = 24; // expiry = DELAY_HOURS + WINDOW_HOURS after Form B lock
export const ASSIST_VOCABULARY = new Set([
  "language-clarification",
  "navigation-help",
  "facilitator-conceptual",
  "visible-ai",
  "other-observed-help"
]);
export const ASSIST_VOCABULARY_VERSION = "li-l00-assist-v1";
export const CLASSIFICATIONS = new Set(["synthetic", "live"]);
export const DISPOSITIONS = new Set(["pass", "fail", "review", "not-run"]);
export const SINGLE_OPERATOR_LIMITATION =
  "single-operator custody; no independent capture attestation";

const HOUR_MS = 3_600_000;
const STAGE_IDS = [
  "form-a.t0-baseline",
  "observe.lesson-00-virtual",
  "form-b.immediate-changed-case",
  "form-c.delayed-fresh-transfer"
];
const SESSION_A_STAGES = STAGE_IDS.slice(0, 3);
const TRANSFER_STAGE = STAGE_IDS[3];

export function fail(code, message) {
  const error = new Error(`li-l00: ${code}: ${message}`);
  error.liCode = code;
  throw error;
}

const sha256 = (text) => createHash("sha256").update(text).digest("hex");

export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

const digestOf = (value) => sha256(canonical(value));

// --- clock policy ------------------------------------------------------------

export function clockFor(classification) {
  const injected = process.env.LI_L00_SYNTHETIC_CLOCK_MS;
  if (injected !== undefined && classification !== "synthetic") {
    fail(
      "clock-policy",
      "a synthetic clock is honored only for classification synthetic; a live run can never be fast-forwarded"
    );
  }
  return () => ({
    wallAt: new Date(
      injected !== undefined ? Number(injected) : Date.now()
    ).toISOString(),
    monoNs: process.hrtime.bigint().toString(),
    clockSource:
      injected !== undefined ? "synthetic-injected-clock" : "local-system-observed"
  });
}

// --- custody store -----------------------------------------------------------

function runDir(runId) {
  if (!/^[0-9a-f-]{36}$/.test(runId)) fail("run-id", "runId must be a uuid");
  return path.join(CUSTODY_ROOT, runId);
}

function chainPath(runId) {
  return path.join(runDir(runId), "chain.ndjson");
}

function readManifest(runId) {
  const file = path.join(runDir(runId), "manifest.json");
  if (!existsSync(file)) fail("no-run", `no manifest for run ${runId}`);
  return JSON.parse(readFileSync(file, "utf8"));
}

function readChain(runId) {
  const file = chainPath(runId);
  if (!existsSync(file)) fail("no-run", `no chain for run ${runId}`);
  return readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function appendEvent(runId, manifestDigest, type, body, clock) {
  const events = existsSync(chainPath(runId)) ? readChain(runId) : [];
  const prevDigest =
    events.length === 0 ? manifestDigest : events[events.length - 1].digest;
  const stamped = { seq: events.length, type, ...clock(), body, prevDigest };
  const event = { ...stamped, digest: digestOf(stamped) };
  appendFileSync(chainPath(runId), `${JSON.stringify(event)}\n`);
  return event;
}

function lockResponse(runId, stageId, text) {
  const dir = path.join(runDir(runId), "responses");
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${stageId}.txt`);
  if (existsSync(file)) fail("already-locked", `${stageId} response already locked`);
  writeFileSync(file, text);
  return sha256(text);
}

// --- input -------------------------------------------------------------------

function assertOpaqueRef(value, label) {
  if (typeof value !== "string" || value.length < 4 || value.length > 128) {
    fail("opaque-ref", `${label} must be a 4-128 char opaque reference`);
  }
  if (/[@\s]/.test(value)) {
    fail(
      "opaque-ref",
      `${label} may not contain spaces or "@": no readable identifier enters the run record`
    );
  }
}

async function collectResponse(scripted, key, promptText) {
  if (scripted) {
    const value = scripted[key];
    if (typeof value !== "string" || value.length === 0) {
      fail("scripted-input", `scripted input missing "${key}"`);
    }
    return value;
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  process.stdout.write(`\n${promptText}\n\n`);
  process.stdout.write(
    "Participant response (multi-line; finish with a single '.' line):\n"
  );
  const lines = [];
  for (;;) {
    const line = await rl.question("> ");
    if (line === ".") break;
    lines.push(line);
  }
  rl.close();
  const answer = lines.join("\n").trim();
  if (!answer) fail("empty-response", "an empty response cannot be locked");
  return answer;
}

function loadScripted(flag) {
  if (!flag) return null;
  return JSON.parse(readFileSync(flag, "utf8"));
}

// --- window ------------------------------------------------------------------

export function windowFrom(formBLockedAtIso) {
  const lockedMs = Date.parse(formBLockedAtIso);
  if (!Number.isFinite(lockedMs)) fail("window", "invalid Form B lock time");
  return {
    t1NotBefore: new Date(lockedMs + DELAY_HOURS * HOUR_MS).toISOString(),
    expiresAt: new Date(
      lockedMs + (DELAY_HOURS + WINDOW_HOURS) * HOUR_MS
    ).toISOString()
  };
}

export function windowDecision(window, nowIso) {
  const nowMs = Date.parse(nowIso);
  if (!Number.isFinite(nowMs)) fail("window", "invalid clock reading");
  if (nowMs < Date.parse(window.t1NotBefore)) return "too-early";
  if (nowMs >= Date.parse(window.expiresAt)) return "expired";
  return "open";
}

// --- commands ----------------------------------------------------------------

export async function startRun({
  consentRef,
  participantRef,
  retentionPolicyVersion,
  classification = "live",
  scriptedPath = null,
  traceFile = null
}) {
  if (!CLASSIFICATIONS.has(classification)) {
    fail("classification", `classification must be one of ${[...CLASSIFICATIONS]}`);
  }
  const scripted = loadScripted(scriptedPath);
  if (scripted && classification !== "synthetic") {
    fail("classification", "scripted input is always classified synthetic");
  }
  if (!scripted && classification === "synthetic") {
    fail("classification", "synthetic classification requires scripted input");
  }
  assertOpaqueRef(consentRef, "consent-ref");
  assertOpaqueRef(participantRef, "participant-ref");
  assertOpaqueRef(retentionPolicyVersion, "retention-policy");

  const contractText = readFileSync(CONTRACT_PATH, "utf8");
  const contract = JSON.parse(contractText);
  const amendmentText = readFileSync(AMENDMENT_PATH, "utf8");
  const clock = clockFor(classification);

  const runId = randomUUID();
  const opened = clock();
  const manifest = {
    schema: "li-l00-run-manifest-v1",
    runId,
    classification,
    consentAttestationRef: consentRef,
    participantRef,
    roles: {
      controller: "per accepted governance packet",
      operator: "founder-single-operator",
      captureOperator: "founder-single-operator"
    },
    lessonId: contract.lessonId,
    mode: "virtual",
    upstreamCommit: UPSTREAM_COMMIT,
    amendment: {
      path: path.relative(lepRoot, AMENDMENT_PATH),
      commit: AMENDMENT_COMMIT,
      sha256: sha256(amendmentText)
    },
    contractSha256: sha256(contractText),
    formIds: STAGE_IDS,
    rubricId: "li-l00-rubric-v1",
    assistanceCondition: "uncontrolled",
    assistanceVocabularyVersion: ASSIST_VOCABULARY_VERSION,
    delayedWindowHours: [DELAY_HOURS, DELAY_HOURS + WINDOW_HOURS],
    captureSoftware: INSTRUMENT,
    clockSource: opened.clockSource,
    retentionPolicyVersion,
    protectedStoreClass: "local-sandbox-custody",
    evaluatorAuthority: "none-capped-review",
    openedAt: opened.wallAt
  };
  mkdirSync(runDir(runId), { recursive: true });
  writeFileSync(
    path.join(runDir(runId), "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  const manifestDigest = digestOf(manifest);
  appendEvent(runId, manifestDigest, "run-opened", { manifestDigest }, clock);

  const stageMeta = {};
  for (const stageId of SESSION_A_STAGES) {
    const stage = contract.evidenceStages.find((s) => s.id === stageId);
    const presented = appendEvent(
      runId,
      manifestDigest,
      "prompt-presented",
      { stageId, promptSha256: sha256(stage.prompt) },
      clock
    );
    let responseText;
    if (stageId === "observe.lesson-00-virtual") {
      // Observation: the participant runs Lesson 00; the operator binds the
      // isolated terminal trace by digest and records a bounded completion
      // note. Completion never substitutes for a learner response.
      const trace = scripted
        ? scripted["observe.trace"]
        : traceFile
          ? readFileSync(traceFile, "utf8")
          : null;
      if (typeof trace !== "string" || trace.length === 0) {
        fail("trace-required", "observation requires an isolated terminal trace (--trace-file)");
      }
      appendEvent(
        runId,
        manifestDigest,
        "artifact-bound",
        { stageId, artifact: "isolated-terminal-trace", sha256: sha256(trace) },
        clock
      );
      responseText = await collectResponse(
        scripted,
        stageId,
        "Bounded completion note (operator; no identity, no storage paths):"
      );
    } else {
      responseText = await collectResponse(scripted, stageId, stage.prompt);
    }
    const responseSha256 = lockResponse(runId, stageId, responseText);
    const locked = appendEvent(
      runId,
      manifestDigest,
      "response-locked",
      { stageId, responseSha256 },
      clock
    );
    appendEvent(
      runId,
      manifestDigest,
      "stage-closed",
      { stageId, state: "complete" },
      clock
    );
    stageMeta[stageId] = {
      promptAt: presented.wallAt,
      lockedAt: locked.wallAt,
      responseSha256
    };
  }

  const window = windowFrom(stageMeta["form-b.immediate-changed-case"].lockedAt);
  appendEvent(runId, manifestDigest, "window-computed", window, clock);
  const events = readChain(runId);
  const rootDigest = events[events.length - 1].digest;
  const closed = appendEvent(
    runId,
    manifestDigest,
    "session-closed",
    { session: "A", rootDigest, limitation: SINGLE_OPERATOR_LIMITATION },
    clock
  );
  mkdirSync(path.join(runDir(runId), "admin"), { recursive: true });
  writeFileSync(
    path.join(runDir(runId), "admin", "session-a-root.json"),
    `${JSON.stringify(
      { session: "A", rootDigest, recordedAt: closed.wallAt },
      null,
      2
    )}\n`
  );
  return { runId, window, rootDigest, stageMeta };
}

export function logAssist({ runId, stageId, kind, actorRole, note, contaminates = false }) {
  if (!ASSIST_VOCABULARY.has(kind)) {
    fail("assist-vocabulary", `kind must be one of ${[...ASSIST_VOCABULARY]}`);
  }
  if (!STAGE_IDS.includes(stageId)) fail("assist-stage", `unknown stage ${stageId}`);
  if (typeof note !== "string" || note.length === 0 || note.length > 280) {
    fail("assist-note", "a bounded description of 1-280 chars is required");
  }
  if (typeof actorRole !== "string" || actorRole.length === 0) {
    fail("assist-actor", "actorRole is required");
  }
  const manifest = readManifest(runId);
  const clock = clockFor(manifest.classification);
  return appendEvent(
    runId,
    digestOf(manifest),
    "assistance-observed",
    { stageId, kind, actorRole, boundedNote: note, contaminates },
    clock
  );
}

export function runStatus(runId) {
  const manifest = readManifest(runId);
  const events = readChain(runId);
  const window = events.find((e) => e.type === "window-computed")?.body;
  if (!window) fail("no-window", "session A has not closed a window yet");
  const clock = clockFor(manifest.classification);
  const now = clock();
  const transferLocked = events.some(
    (e) => e.type === "response-locked" && e.body.stageId === TRANSFER_STAGE
  );
  const transferClosed = events.find(
    (e) => e.type === "stage-closed" && e.body.stageId === TRANSFER_STAGE
  );
  return {
    runId,
    classification: manifest.classification,
    window,
    now: now.wallAt,
    decision: transferLocked
      ? "captured"
      : transferClosed
        ? transferClosed.body.state
        : windowDecision(window, now.wallAt)
  };
}

export async function resumeRun({ runId, scriptedPath = null }) {
  const manifest = readManifest(runId);
  const scripted = loadScripted(scriptedPath);
  if (scripted && manifest.classification !== "synthetic") {
    fail("classification", "scripted input is always classified synthetic");
  }
  const clock = clockFor(manifest.classification);
  const manifestDigest = digestOf(manifest);
  const events = readChain(runId);
  if (events.some((e) => e.type === "response-locked" && e.body.stageId === TRANSFER_STAGE)) {
    fail("already-locked", "Form C is already captured");
  }
  if (events.some((e) => e.type === "stage-closed" && e.body.stageId === TRANSFER_STAGE)) {
    fail("already-closed", "Form C was already closed (missing/expired)");
  }
  const window = events.find((e) => e.type === "window-computed")?.body;
  if (!window) fail("no-window", "session A has not closed a window yet");

  const now = clock();
  const decision = windowDecision(window, now.wallAt);
  if (decision === "too-early") {
    appendEvent(
      runId,
      manifestDigest,
      "transfer-refused",
      { stageId: TRANSFER_STAGE, decision, at: now.wallAt },
      clock
    );
    fail(
      "window-too-early",
      `fail-closed: the delayed form may not be shown before ${window.t1NotBefore}`
    );
  }
  if (decision === "expired") {
    appendEvent(
      runId,
      manifestDigest,
      "transfer-refused",
      { stageId: TRANSFER_STAGE, decision, at: now.wallAt },
      clock
    );
    appendEvent(
      runId,
      manifestDigest,
      "stage-closed",
      { stageId: TRANSFER_STAGE, state: "missing", reason: "window-expired" },
      clock
    );
    closeSessionC(runId, manifestDigest, clock);
    return { runId, decision: "expired", captured: false };
  }

  const contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));
  const stage = contract.evidenceStages.find((s) => s.id === TRANSFER_STAGE);
  appendEvent(
    runId,
    manifestDigest,
    "prompt-presented",
    { stageId: TRANSFER_STAGE, promptSha256: sha256(stage.prompt) },
    clock
  );
  const responseText = await collectResponse(scripted, TRANSFER_STAGE, stage.prompt);
  const responseSha256 = lockResponse(runId, TRANSFER_STAGE, responseText);
  appendEvent(
    runId,
    manifestDigest,
    "response-locked",
    { stageId: TRANSFER_STAGE, responseSha256 },
    clock
  );
  appendEvent(
    runId,
    manifestDigest,
    "stage-closed",
    { stageId: TRANSFER_STAGE, state: "complete" },
    clock
  );
  closeSessionC(runId, manifestDigest, clock);
  return { runId, decision: "open", captured: true };
}

function closeSessionC(runId, manifestDigest, clock) {
  const events = readChain(runId);
  const rootDigest = events[events.length - 1].digest;
  const closed = appendEvent(
    runId,
    manifestDigest,
    "session-closed",
    { session: "C", rootDigest, limitation: SINGLE_OPERATOR_LIMITATION },
    clock
  );
  writeFileSync(
    path.join(runDir(runId), "admin", "session-c-root.json"),
    `${JSON.stringify(
      { session: "C", rootDigest, recordedAt: closed.wallAt },
      null,
      2
    )}\n`
  );
}

export function verifyRun(runId) {
  const manifest = readManifest(runId);
  const manifestDigest = digestOf(manifest);
  const events = readChain(runId);
  let prev = manifestDigest;
  for (const event of events) {
    const { digest, ...stamped } = event;
    if (stamped.prevDigest !== prev) {
      fail("chain-broken", `event ${event.seq}: prevDigest mismatch`);
    }
    if (digestOf(stamped) !== digest) {
      fail("chain-broken", `event ${event.seq}: digest mismatch`);
    }
    prev = digest;
  }
  const deleted = events.some((e) => e.type === "raw-deleted");
  const responses = {};
  for (const event of events) {
    if (event.type !== "response-locked") continue;
    const file = path.join(runDir(runId), "responses", `${event.body.stageId}.txt`);
    if (!existsSync(file)) {
      if (!deleted) fail("raw-missing", `${event.body.stageId} raw response missing without a deletion event`);
      responses[event.body.stageId] = "raw-deleted";
      continue;
    }
    const actual = sha256(readFileSync(file, "utf8"));
    if (actual !== event.body.responseSha256) {
      fail("raw-tampered", `${event.body.stageId} raw response digest mismatch`);
    }
    responses[event.body.stageId] = "verified";
  }
  return { runId, events: events.length, chain: "verified", responses };
}

export async function reviewRun({ runId, evaluatorRole, scriptedPath = null }) {
  const manifest = readManifest(runId);
  const scripted = loadScriptedReview(scriptedPath);
  const clock = clockFor(manifest.classification);
  const manifestDigest = digestOf(manifest);
  const events = readChain(runId);
  if (typeof evaluatorRole !== "string" || evaluatorRole.length === 0) {
    fail("evaluator", "evaluator role is required");
  }
  const capped = manifest.evaluatorAuthority !== "governance-packet-accepted";
  const contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));
  const records = [];
  for (const stageId of ["form-b.immediate-changed-case", TRANSFER_STAGE]) {
    const lockEvent = events.find(
      (e) => e.type === "response-locked" && e.body.stageId === stageId
    );
    const closed = events.find(
      (e) => e.type === "stage-closed" && e.body.stageId === stageId
    );
    let disposition;
    let basis;
    if (!lockEvent) {
      disposition = "not-run";
      basis = closed?.body.reason ?? "no locked response";
    } else {
      const stage = contract.evidenceStages.find((s) => s.id === stageId);
      const input = scripted
        ? scripted[stageId]
        : await promptReview(stageId, stage.evaluation.passCondition, runId);
      if (!DISPOSITIONS.has(input.disposition)) {
        fail("disposition", `disposition must be one of ${[...DISPOSITIONS]}`);
      }
      disposition = input.disposition;
      basis = input.note ?? "";
      if (capped && disposition === "pass") {
        disposition = "review";
        basis = `${basis} [capped: evaluator authority not established by an accepted governance packet]`.trim();
      }
    }
    const record = {
      stageId,
      disposition,
      basis,
      evaluatorRole,
      rubricId: manifest.rubricId,
      rubricVersion: "v1",
      responseSha256: lockEvent?.body.responseSha256 ?? null
    };
    appendEvent(runId, manifestDigest, "review-recorded", record, clock);
    records.push(record);
  }
  return { runId, capped, records };
}

function loadScriptedReview(flag) {
  if (!flag) return null;
  return JSON.parse(readFileSync(flag, "utf8"));
}

async function promptReview(stageId, passCondition, runId) {
  const raw = path.join(runDir(runId), "responses", `${stageId}.txt`);
  if (!existsSync(raw)) fail("raw-missing", `${stageId} raw response unavailable for review`);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  process.stdout.write(
    `\n[${stageId}]\nLocked response:\n${readFileSync(raw, "utf8")}\n\nRubric v1: ${passCondition}\n\n`
  );
  const disposition = await rl.question("Disposition (pass/fail/review/not-run): ");
  const note = await rl.question("Bounded basis note: ");
  rl.close();
  return { disposition: disposition.trim(), note: note.trim() };
}

export function buildPackage({ runId, summary = "", paraphrasedQuestions = [] }) {
  const manifest = readManifest(runId);
  const events = readChain(runId);
  const transferOpen =
    !events.some(
      (e) =>
        (e.type === "response-locked" || e.type === "stage-closed") &&
        e.body.stageId === TRANSFER_STAGE
    );
  if (transferOpen) {
    fail("transfer-pending", "the delayed form is still pending; package only after final state");
  }
  const reviews = events.filter((e) => e.type === "review-recorded");
  if (reviews.length === 0) {
    fail("review-required", "package requires recorded evaluator dispositions");
  }
  if (typeof summary !== "string" || /[@]/.test(summary)) {
    fail("summary", "summary must be a consented de-identified string");
  }
  const window = events.find((e) => e.type === "window-computed")?.body ?? null;
  const stages = [];
  for (const stageId of STAGE_IDS) {
    const presented = events.find(
      (e) => e.type === "prompt-presented" && e.body.stageId === stageId
    );
    const lock = events.find(
      (e) => e.type === "response-locked" && e.body.stageId === stageId
    );
    const closedEvents = events.filter(
      (e) => e.type === "stage-closed" && e.body.stageId === stageId
    );
    const closed = closedEvents[closedEvents.length - 1];
    const review = reviews.filter((e) => e.body.stageId === stageId).pop();
    stages.push({
      stageId,
      state: closed?.body.state ?? "missing",
      reason: closed?.body.reason ?? null,
      responseSha256: lock?.body.responseSha256 ?? null,
      lockedAt: lock?.wallAt ?? null,
      responseLatencyMs:
        presented && lock
          ? Date.parse(lock.wallAt) - Date.parse(presented.wallAt)
          : null,
      disposition: review?.body.disposition ?? null,
      dispositionBasis: review?.body.basis ?? null
    });
  }
  const chainRoot = events[events.length - 1].digest;
  const pkg = {
    packageType: "li-l00-portable-v1",
    runRef: manifest.runId,
    classification: manifest.classification,
    createdAt: new Date().toISOString(),
    instrument: manifest.captureSoftware,
    bindings: {
      manifestSha256: digestOf(manifest),
      chainRootDigest: chainRoot,
      contractSha256: manifest.contractSha256,
      amendment: manifest.amendment,
      upstreamCommit: manifest.upstreamCommit,
      lessonId: manifest.lessonId,
      mode: manifest.mode
    },
    assistanceCondition: manifest.assistanceCondition,
    assistanceEvents: events
      .filter((e) => e.type === "assistance-observed")
      .map((e) => ({
        stageId: e.body.stageId,
        kind: e.body.kind,
        actorRole: e.body.actorRole,
        boundedNote: e.body.boundedNote,
        contaminates: e.body.contaminates,
        at: e.wallAt
      })),
    window,
    stages,
    limitations: [
      SINGLE_OPERATOR_LIMITATION,
      "external-ai-use-not-observable",
      "results capped at review: evaluator authority not established by an accepted governance packet",
      "n=1: no course-effectiveness, population, mastery or AI-effect claim"
    ],
    summary: { deIdentifiedSummary: summary, paraphrasedQuestions }
  };
  const file = path.join(runDir(runId), "portable.json");
  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
  return pkg;
}

export function deleteRawResponses({ runId, role }) {
  if (role !== "controller-operator") {
    fail("role", "raw deletion requires --role controller-operator");
  }
  const manifest = readManifest(runId);
  const clock = clockFor(manifest.classification);
  const dir = path.join(runDir(runId), "responses");
  const deleted = [];
  if (existsSync(dir)) {
    for (const name of readdirSync(dir)) {
      rmSync(path.join(dir, name));
      deleted.push(name.replace(/\.txt$/, ""));
    }
    rmSync(dir, { recursive: true, force: true });
  }
  const event = appendEvent(
    runId,
    digestOf(manifest),
    "raw-deleted",
    { stages: deleted, role },
    clock
  );
  return { runId, deleted, loggedAt: event.wallAt };
}

// --- CLI ---------------------------------------------------------------------

const usage = `usage:
  capture.mjs start  --consent-ref <opaque> --participant-ref <opaque> \\
                     --retention-policy <version> [--trace-file <path>] \\
                     [--classification live|synthetic] [--scripted <json>]
  capture.mjs assist --run <id> --stage <stageId> --kind <vocab> --actor <role> \\
                     --note "<bounded>" [--contaminates]
  capture.mjs status --run <id>
  capture.mjs resume --run <id> [--scripted <json>]
  capture.mjs verify --run <id>
  capture.mjs review --run <id> --evaluator-role <role> [--scripted <json>]
  capture.mjs package --run <id> [--summary "<de-identified>"]
  capture.mjs delete --run <id> --role controller-operator

The delayed window (72-96h from the Form B lock) comes from the amendment and
cannot be passed in. LI_L00_SYNTHETIC_CLOCK_MS is honored only for synthetic runs.`;

function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) fail("usage", `unexpected argument ${key}`);
    if (key === "--contaminates") {
      flags[key] = true;
      continue;
    }
    const value = argv[++i];
    if (value === undefined || value.startsWith("--")) {
      fail("usage", `${key} requires a value`);
    }
    flags[key] = value;
  }
  return flags;
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const out = (value) => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
  try {
    const flags = parseArgs(rest);
    if (command === "start") {
      out(
        await startRun({
          consentRef: flags["--consent-ref"],
          participantRef: flags["--participant-ref"],
          retentionPolicyVersion: flags["--retention-policy"],
          classification: flags["--classification"] ?? (flags["--scripted"] ? "synthetic" : "live"),
          scriptedPath: flags["--scripted"] ?? null,
          traceFile: flags["--trace-file"] ?? null
        })
      );
    } else if (command === "assist") {
      out(
        logAssist({
          runId: flags["--run"],
          stageId: flags["--stage"],
          kind: flags["--kind"],
          actorRole: flags["--actor"],
          note: flags["--note"],
          contaminates: flags["--contaminates"] === true
        })
      );
    } else if (command === "status") {
      out(runStatus(flags["--run"]));
    } else if (command === "resume") {
      out(await resumeRun({ runId: flags["--run"], scriptedPath: flags["--scripted"] ?? null }));
    } else if (command === "verify") {
      out(verifyRun(flags["--run"]));
    } else if (command === "review") {
      out(
        await reviewRun({
          runId: flags["--run"],
          evaluatorRole: flags["--evaluator-role"],
          scriptedPath: flags["--scripted"] ?? null
        })
      );
    } else if (command === "package") {
      out(
        buildPackage({
          runId: flags["--run"],
          summary: flags["--summary"] ?? "",
          paraphrasedQuestions: []
        })
      );
    } else if (command === "delete") {
      out(deleteRawResponses({ runId: flags["--run"], role: flags["--role"] }));
    } else {
      process.stderr.write(`${usage}\n`);
      process.exitCode = 2;
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

const invokedDirectly =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (invokedDirectly) await main();
