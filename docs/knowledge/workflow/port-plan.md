---
type: Playbook
title: macOS port plan
description: Ordered work items to get SandTogether running on the macOS Steam build of Sandustry.
tags: [porting, plan, macos]
use_when:
  - starting a work session on this repo and choosing what to do next
  - writing a design spec for any port work item
timestamp: 2026-08-19T01:00:00Z
---

# macOS port plan

The mod's JS (renderer, main-process, preload) is platform-neutral; the
port is about installation, launch, paths, and anchor verification. Order:

1. **Anchor audit** — ✅ DONE 2026-08-18: all 15 anchors (14 bundle +
   1 mainJs) resolve exactly once against the mac 0.5.2 files; details
   in [version-skew](../gotchas/version-skew.md). Re-run after any game
   or `patches.json` update (extract via
   `npx @electron/asar extract-file <app.asar> dist/js/bundle.js`).
2. **Installer** — ✅ DONE 2026-08-18: `dist-package-mac/install.js` +
   `install.command`. See
   [build-and-install-macos](build-and-install-macos.md).
3. **Launcher** — ✅ DONE 2026-08-18:
   `dist-package-mac/SandTogether-Launch.command` (re-runs installer if
   asar restored, then steam:// launch).
4. **First modded run** — ✅ DONE 2026-08-18 on this machine: launches
   clean on arm64 (codesign non-issue, see
   [macos-codesign](../gotchas/macos-codesign.md)); `[SandTogether]`
   active in `~/Library/Logs/Sandustry/main.log`, world state captured,
   event subscriptions live.
5. **Two-instance LAN test** — ✅ DONE 2026-08-18: upstream's clickless
   `--st-autotest=host` / `--st-autotest=join --st-userdata=/tmp/st2`
   flags used; peers connected, players visible to each other, world
   stream live both ways (host ~30–55 KB/s, 60–130 chunks/s; client
   mirroring). Host shows a false "old mod" warning — upstream WS
   quirk, see
   [ws-hello-mver-false-alarm](../gotchas/ws-hello-mver-false-alarm.md).
6. **Steam P2P test** — ✅ DONE 2026-08-18 mac↔mac after fixing the
   snake_case callback bug
   ([steam-invite-join-fails-macos](../gotchas/steam-invite-join-fails-macos.md)):
   friend-list invite → joined in ~350 ms, P2P hello + mver both ways.
   In-game Invite button remains dead on mac (overlay —
   [invite-button-overlay-macos](../gotchas/invite-button-overlay-macos.md)).
   Cross-platform vs Windows still untested.
7. **Player docs** — ✅ DONE: EN in PR #2; upstream author added the PL
   INSTRUKCJA notes himself post-merge.

**UPSTREAMED 2026-08-18:** PR #2 (installer/launcher/docs) and PR #3
(snake_case invite-join fix) both merged the same day. macOS support is
now official; next Workshop publish ships it to subscribers. Remaining
ideas: darwin Invite-button UX
([invite-button-overlay-macos](../gotchas/invite-button-overlay-macos.md)),
the two small upstream bugs (mver false alarm, red blocks), and
cross-platform mac↔Windows testing.

Knowledge impact: every step that verifies an "unverified" claim in the
gotcha concepts updates that concept in the same session.

## Related

- [mod-architecture](../systems/mod-architecture.md) — the thing being ported
- [windows-assumptions](../gotchas/windows-assumptions.md) — full replacement inventory
