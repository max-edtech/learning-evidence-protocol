# Phase 0 field report: little-internet Lesson 00

Date: 2026-06-29  
Status: Technical reproduction passed; learning claim not yet evaluated

## Executive verdict

The virtual version of `little-internet` Lesson 00 runs successfully on Apple
Silicon through a small Colima Linux VM.

The run produced inspectable system evidence for the lesson's central contrast:

```text
physical link present
does not imply
IPv4 reachability present
```

This is not evidence that a learner understood the contrast. The operator had
already inspected the source, and no independent prediction, explanation, or
transfer response was collected. The corresponding LEP record therefore remains
`review`, not `pass`.

That separation between operational success and learning evidence is the main
Phase 0 result.

## Baseline

| Item | Value |
|---|---|
| Host | Apple Silicon (`arm64`) |
| Host OS | macOS 26.5.1 |
| Virtualization | Colima 0.10.3 using Apple Virtualization.Framework |
| VM | Ubuntu Noble, Linux 6.8, `aarch64` |
| VM allocation | 2 CPU, 2 GiB memory |
| Upstream repository | `ngrok/little-internet` |
| Upstream branch | `joelhans/lesson-00-and-diary` |
| Tested commit | `a5564a3540807cfa6fd24886161dcaf55c81a80a` |
| Hardware purchased | None |

## Phase 0 hypotheses

| Hypothesis | Result | Evidence |
|---|---|---|
| A Mac user can reach the virtual lesson without buying hardware | Pass with setup friction | Colima VM mounted the local repository and executed the namespace lab |
| The virtual lab preserves the lesson's central causal contrast | Pass | Link-up and IPv6 chatter existed before IPv4 reachability |
| The documented path is a complete first-run experience | Not yet | The default VM lacked `ping`, `tcpdump`, and `tmux` |
| The lesson produces inspectable machine evidence | Pass | Route state, ping results, neighbor state, and packet captures were observable |
| A learner understands the model after completing the lesson | Not tested | No valid pre-prediction, explanation, or changed-case transfer response was collected |

## What was reproduced

### 1. Link activity without IPv4 reachability

The virtual lab created two network namespaces connected by one veth pair. Both
interfaces were up with no IPv4 addresses.

Bringing the link up produced ten captured IPv6 frames, including:

- duplicate-address detection traffic;
- multicast listener reports;
- router solicitation.

The environment was not silent even though no IPv4 identity had been assigned.

### 2. The first ping failed for a specific reason

Before addressing:

```text
ping: connect: Network is unreachable
```

`ip -4 addr show eth0` had no `inet` line, and `ip route get 10.10.0.2`
returned `Network is unreachable`.

This is stronger evidence than a generic "ping failed" outcome because it
preserves the missing condition.

### 3. Addressing changed the route

After assigning `10.10.0.1/24` and `10.10.0.2/24`, route lookup resolved the
peer through `eth0`. The same ping then completed with two replies and zero
packet loss.

### 4. ARP made the hidden introduction visible

After clearing the neighbor entry, the packet capture contained six frames:

1. ARP request: who has `10.10.0.2`;
2. ARP reply: `10.10.0.2` is at its virtual MAC;
3. ICMP echo request;
4. ICMP echo reply;
5. second ICMP echo request;
6. second ICMP echo reply.

The second echo did not require another ARP exchange because the neighbor cache
had become `REACHABLE`.

Artifact fingerprints:

| Artifact | Frames | SHA-256 |
|---|---:|---|
| Link-up capture | 10 | `0c688a0f200f4f66a6eb80370b9af38642f32f07464af1e18f4f8fcd1474f4bb` |
| First-ARP capture | 6 | `f6450da29a02797539b0f6bbba63d331a405cdfe81307b0f7630d720cc018eca` |

The captures were generated inside an isolated synthetic lab. They are
fingerprinted here but are not redistributed by this repository.

### 5. The dashboard worked with an explicit terminal override

The two-pane ARP dashboard initially failed under Colima SSH:

```text
open terminal failed: terminal does not support clear
```

The session reported `TERM=dumb`. The script's fallback did not activate because
`dumb` has a known terminfo entry even though it is unsuitable for this tmux
layout.

Running with `TERM=xterm-256color` created all three panes successfully:

- `pi-a` neighbor cache;
- `pi-b` neighbor cache;
- an interactive shell inside `pi-a`.

This is a narrow terminal-detection issue, not a failure of the virtual network.

## First-run friction

### Host setup

The Mac had no Linux VM or container tooling installed. Reproduction required:

```text
Homebrew
→ Colima
→ Lima dependency
→ Docker CLI
→ first VM boot
```

Docker itself was not required by Lesson 00, but the default Colima setup
provisioned the Docker runtime.

### Guest dependencies

The fresh VM already had `ip`, `python3`, and `ethtool`, but lacked:

- `iputils-ping`;
- `tcpdump`;
- `tmux`.

The lesson documentation mentions Linux and Colima, while the complete package
preflight is not yet learner-facing.

### Dashboard terminal

The core lesson completed before the optional dashboard. A headless or limited
terminal can still fail at this final step unless `TERM` is suitable.

## Learning-experience observations

### Strongest conceptual moment

The sequence creates a useful contradiction:

```text
link is alive
frames are moving
ping is still unreachable
```

This is a better teaching object than a definition of network layers because
the learner encounters a failed prediction in a causal system.

### Main command-karaoke risk

The scripts provide excellent narration and show exactly what to inspect.
However, a learner can continue by pressing Enter without externalizing:

- their prediction before the command;
- their explanation after the observation;
- whether the model transfers to a changed topology.

The system therefore records that the lesson ran, not that the learner's mental
model changed.

### Hardware and virtual versions play different roles

The virtual lesson preserves the central network-stack evidence. It cannot
preserve physical carrier, negotiated speed and duplex, Ethernet padding, or
Raspberry Pi vendor MAC prefixes.

The virtual version is a low-cost entry point. The hardware version remains an
embodied proof of the physical layer rather than a prerequisite for every
concept.

## Recommended next experiment

Do not add AI yet.

Run the same lesson with three to five learners who have basic command-line
ability but cannot already explain the result. Collect only:

1. a committed prediction before the first ping;
2. the observation they consider decisive;
3. a causal explanation after addressing;
4. one changed-case transfer response;
5. setup friction and completion time.

Exit criteria for Phase 0:

- at least three complete traces;
- no collection of personal data beyond an anonymous run ID;
- technical evidence remains separable from human-evaluated evidence;
- unclear explanations remain `review`;
- one documented decision on whether the protocol needs a schema change.

## Independence and attribution

This report evaluates a public development branch of
[`ngrok/little-internet`](https://github.com/ngrok/little-internet). It is an
independent reproduction and is not affiliated with or endorsed by ngrok.

No upstream scripts or packet-capture files are redistributed here.

