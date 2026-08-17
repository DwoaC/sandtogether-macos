# SandTogether — co-op multiplayer mod for Sandustry (v0.5.0)

**Author: Kamil Padula**

SandTogether adds full co-op multiplayer to Sandustry. Both players MUST have
the mod installed (same version) and the same game version (0.5.3).

Polska instrukcja: zobacz `INSTRUKCJA.md`.

## Installation

1. Have Sandustry installed from Steam (launch it once normally).
2. Right-click `install.ps1` → **Run with PowerShell**
   (if Windows blocks it: `powershell -ExecutionPolicy Bypass -File install.ps1`).
3. The script finds the game, unpacks its code and applies the mod
   (installs Node.js automatically if missing).

## How to play (over the internet, via Steam — no network setup)

**Host:**
1. Launch the game → the **SandTogether** panel (top-right corner) → **Host (Steam)** → **Invite** (pick your friend).
2. Load/start a game, save it, then click **Send world**.

**Joining player:**
1. Accept the Steam invite.
2. After the import message: **Load Game** → load the received world.
3. From now on you play in the host's world (the panel shows "host mirror").

**LAN/testing:** Host LAN / Join LAN (`ip:27777`). **Click the panel header** (or Ctrl+Shift+H) to hide/show it.
**Resync** forces a full world refresh.

## What works (0.5 — full co-op)

- Connection via Steam (friend invites) or LAN; up to 4 players
- You see each other's characters, nicknames and projectiles live
- **Shared live world**: sand, fluids, digging, terrain changes, unlocked zones —
  the host's world is streamed to the client (10–50 KB/s); one authoritative simulation
- **Client weapons fully work**: digging, spray, firearms & rockets (impacts executed on host)
- **Buildings & machines**: place, demolish AND move on both sides; machine state
  reconciled every 2.5 s; conveyors, pipes, the whole factory — shared
- **Item pickup** by both players (with proper effects: artifacts, orbs, keys)
- **Creatures & drones** streamed to the client (10 Hz)
- **Shared resources and story progression** (gold/energy/production/gloom)
- **Client's vacuum** — collects into its own tanks with real capacity tiers
- World-event sounds forwarded to the client

## Important note for the joining player

While connected as a client, do not rely on saving the game — your save would
capture the world state from the moment you joined, not the current one.
The host's save is the authoritative one; ask the host to use **Send world**
whenever you want a fresh copy.

## Notes & known behaviors

- Remote players' projectiles render as simple tracers (not full sprites)
- Creatures/drones on the client update at 10 Hz (slight jitter possible)
- If both players grab the same item in the same instant, a rare duplicate can occur
- After a **Steam game update** the mod is removed — run `install.ps1` again

## Uninstall

Steam → Sandustry → Properties → Installed Files → Verify integrity of game files,
then delete the `resources\app` folder.

---
SandTogether by **Kamil Padula**
