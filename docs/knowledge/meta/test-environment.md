---
type: System
title: Multiplayer test environment
description: The two machines available for co-op testing, their state, and the test sequence for the macOS port.
tags: [testing, multiplayer, network, machines]
use_when:
  - planning or running a multiplayer test session
  - deploying a mod build to the second test machine
timestamp: 2026-08-18T22:00:00Z
---

# Multiplayer test environment

Two-Mac test rig on the home LAN (network details:
`../home_network` repo, sibling of this one). Verified 2026-08-18.

## Machines

| | Jason's Mac (dev) | Tony's MacBook Neo |
|---|---|---|
| mDNS / IP | (this machine) | `Tonys-MacBook-Neo.local` = 10.194.1.156 (up 2026-08-18) |
| Sandustry | installed, 0.5.2 / buildid 24719878 | installed, 0.5.2 / buildid 24719878 (verified over SSH 2026-08-18) — identical depot |
| Workshop item 3784750764 | subscribed | subscribed, content present (installer is .bat/.ps1 — unusable until our installer exists) |
| Remote access | — | **SSH working**: `ssh neo` (alias in Jason's `~/.ssh/config` → `tony@Tonys-MacBook-Neo.local`, key-based). arm64, macOS 26.5. Deploy builds with `rsync ... neo:` |

Steam accounts must be friends for invite testing. Both machines on the
same mac depot ⇒ **no game-version skew inside this rig** — the
0.5.2↔0.5.x cross-version question stays untested until a Windows
machine joins (tier 3).

Not Tony's machine: `BLACK-DESKTOP.local` (10.194.1.186, Windows,
Sunshine on :47989) — some other box on the LAN; noted here so nobody
re-derives it as a test candidate without checking whose it is.

## Mod deployment rule

Install BOTH machines from this fork at the **same pinned commit** (the
in-game panel hard-warns on mod version mismatch, and the upstream
Workshop item auto-updates on its own schedule — don't mix sources).

## Deployment state

Mod deployed to Neo 2026-08-18 from fork commit `38eb6e9`: repo rsynced
to `neo:~/sandtogether-macos/`, installer run over SSH (20/20 changes),
patched files verified. Jason's machine installed from the same tree.
Redeploy after changes: `rsync -a --exclude .git <repo>/ neo:sandtogether-macos/`
then run `install.js` over SSH via the game's Electron.

## Test sequence

1. **Tier 1** — ✅ PASSED 2026-08-18 (two instances on Jason's Mac,
   loopback 27777, `--st-autotest`; world stream live both ways).
2. **Tier 2a** — Jason ↔ Neo over LAN: host on Jason's Mac (IP
   10.194.1.173), Tony joins `10.194.1.173:27777` via the panel's Join
   LAN. macOS firewall may prompt on the host's listener. Expect the
   false "old mod" warning on the host —
   [ws-hello-mver-false-alarm](../gotchas/ws-hello-mver-false-alarm.md).
3. **Tier 2b** — Steam P2P: Host (Steam) → Invite → accept. Exercises
   osx steamworks.js, invite flow, `+connect_lobby` passthrough. If 2a
   works and 2b fails, the fault is in the Steam layer, not the sync.
4. On any failure grab both sides' `[SandTogether]`-tagged logs
   (`~/Library/Logs/Sandustry/main.log`).

## Related

- [port-plan](../workflow/port-plan.md) — installer/launcher gate all of this
- [workshop-distribution](../systems/workshop-distribution.md) — why the subscription alone installs nothing on mac
- [version-skew](../gotchas/version-skew.md) — the cross-version risk this rig cannot test
