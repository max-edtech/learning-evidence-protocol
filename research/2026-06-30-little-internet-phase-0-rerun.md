# Phase 0 follow-up: latest Lesson 00 rerun and coupling boundary

Date: 2026-06-30
Status: Latest technical reproduction completed; learning claim remains `review`

## Outcome

The virtual version of `ngrok/little-internet` Lesson 00 completed successfully
at upstream commit
[`dff5d981`](https://github.com/ngrok/little-internet/commit/dff5d981e9386e16aca750261837d4c3b18d3e84).

The rerun reproduced the same causal sequence as the initial Phase 0 run:

```text
link up and IPv6 frames present
→ no IPv4 address or route
→ ping reports Network is unreachable
→ same-subnet IPv4 identities create routes through eth0
→ ARP resolves the peer MAC
→ ICMP request and reply succeed
```

The corresponding evidence record is
[`networking-lesson-00.phase-0-dff5d98.evidence.json`](../examples/networking-lesson-00.phase-0-dff5d98.evidence.json).

## Environment

| Item | Value |
|---|---|
| Host | Apple Silicon macOS 26.5.1 |
| Virtualization | Colima 0.10.3, Apple Virtualization.framework |
| Guest | Ubuntu Noble, Linux 6.8, `aarch64` |
| VM allocation | 2 CPU, 2 GiB memory |
| Upstream branch | `joelhans/lesson-00-and-diary` |
| Tested commit | `dff5d981e9386e16aca750261837d4c3b18d3e84` |
| Hardware purchased | None |

The VM already contained the dependencies installed during the first run.
This follow-up therefore validates the current lesson behavior, not the
fresh-environment setup path.

## Observed evidence

Before IPv4 addressing:

- the link bounce produced 15 captured IPv6 frames;
- `eth0` had no IPv4 `inet` line;
- both `ping 10.10.0.2` and `ip route get 10.10.0.2` reported
  `Network is unreachable`.

After assigning `10.10.0.1/24` and `10.10.0.2/24`:

- route lookup selected `dev eth0` with the expected source address;
- ping returned two replies with zero packet loss;
- after the neighbor cache was flushed, the six-frame capture showed ARP
  `who-has`, ARP `is-at`, then two ICMP request and reply pairs;
- the neighbor state became `REACHABLE`.

`tshark` was absent, and the lesson's documented `tcpdump` fallback worked.
The virtual run skipped Layer 1 because a veth pair has no physical PHY.

## What changed upstream

The current lesson branch is more reproducible on hardware than the commit used
for the initial report. It now restores a stock `eth-dhcp` baseline that can
produce DHCP, IPv6, and mDNS link-up chatter without taking over the management
route. The Pi image also carries that baseline for fresh flashes.

Those hardware-specific changes were inspected but not exercised in this
virtual run.

An additional open contribution,
[`PR #7`](https://github.com/ngrok/little-internet/pull/7), proposes:

- an agent teaching guide;
- a machine-readable Lesson 00 manifest;
- read-only hardware and virtual preflight checks.

That PR is not merged into the tested branch, and its head `55223c0a` has
diverged from `dff5d981`. Its manifest still describes the earlier reset model:
deleting the lesson connection to return to a blank wire. The current lesson
instead restores an addressless but intentionally chatty `eth-dhcp` baseline.
It also has newer dashboard, SSH color, and closing transfer behavior that the
proposed manifest does not describe.

The manifest is therefore a promising future adapter input only after a rebase
and semantic update. This reproduction does not load or depend on it.

## Coupling boundary

The two projects have complementary responsibilities:

| Layer | Responsibility |
|---|---|
| `little-internet` | Produce the topology, commands, packet captures, and observable network states. |
| LEP lesson contract | State the bounded learning claim and required evidence stages. |
| Private evidence runner | Lock learner responses, keep system and learner evidence separate, schedule fresh transfer and retention, and route ambiguous evidence to review. |

The upstream lesson should not need to adopt the LEP schema. A sidecar adapter
can map stable lesson beat IDs to LEP checkpoints:

```text
01-listen / 02-no-address → prediction and observation
03-address / 04-arp       → causal explanation
changed firewall/service/subnet cases → transfer
fresh unresolved-ARP case → D7 retention
```

This avoids two failure modes:

1. treating successful command execution as proof of understanding;
2. burdening the upstream teaching repository with private learner records,
   scoring logic, or product-specific assessment rules.

## Current claim boundary

This follow-up supports:

> A Mac user can reproduce the lesson's central link-versus-reachability
> contrast without buying hardware.

It does not yet support:

> A human learner who completes the lesson understands the causal model and can
> transfer it.

The operator had prior source exposure, and no valid learner prediction,
explanation, changed-case response, or delayed retention response was collected.
The learning claim therefore remains `review`.

Synthetic-agent traces may test prompt leakage, storage, schema validity, and
false-pass guardrails. They must remain labeled synthetic and cannot substitute
for human learner evidence.

## Next human run

Use a participant who has not seen the output, or explicitly record prior
exposure. Lock these responses in order:

1. prediction before system output;
2. decisive observation and its limits;
3. explanation of address, route, and ARP;
4. fresh firewall, service-port, and incompatible-subnet cases;
5. a delayed unresolved-ARP case.

Every response remains `review` until calibrated human evaluation. Missing
retention evidence is missing evidence, not failure and not mastery.

## Independence and attribution

This is an independent reproduction of a public development branch of
[`ngrok/little-internet`](https://github.com/ngrok/little-internet). It is not
affiliated with or endorsed by ngrok. No upstream scripts, learner records, or
packet-capture files are redistributed here.
