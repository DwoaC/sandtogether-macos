---
type: Gotcha
title: In-game Invite button dead on macOS (Steam overlay)
description: The panel's Invite button calls the Steam overlay invite dialog, which doesn't render in Electron games on macOS — invites must go via the friends list or lobby-ID join.
tags: [steam-overlay, invite, macos, open-bug]
use_when:
  - a mac player reports the Invite button doing nothing
  - working on the invite flow or writing mac player docs
timestamp: 2026-08-18T23:59:00Z
---

# In-game Invite button dead on macOS

Open (2026-08-18). `st:invite` → `S.lobby.openInviteDialog()`
(`src/st-main.js` ~375) opens the Steam **overlay** invite dialog. The
overlay doesn't render in this Electron game on macOS, so clicking
Invite does nothing visible and no invite is sent.

## Workarounds (both verified working)

- Steam **friends list**: friend right-clicks the host → Join Game
  (rich presence `+connect_lobby` is set on hosting), or host invites
  from the friends UI.
- Lobby-ID clipboard join (panel).

## Fix directions (untried)

- Detect `process.platform === 'darwin'` and replace the Invite button
  with "lobby ID copied — friend uses Join Game in the friends list".
- Or investigate overlay enablement for Electron on mac (long shot).

Mac player docs should steer to the friends-list flow.

## Related

- [steam-invite-join-fails-macos](steam-invite-join-fails-macos.md) — the join-side bug, fixed
