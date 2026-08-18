# SandTogether — Fix game build 0.5.4 + placement/removal/ghost/grabber

Compatibility: **game build 0.5.4** (patch anchors are 0.5.4-specific; older-build anchors kept as fallback variants where possible). Mod version bumped to `0.9.26-beta`.

Both players must run the same version. The world-mirror protocol changed (v3 → v4), so a v3 client and v4 host will refuse each other (no corruption — the version check rejects).

## Files changed
- `src/sandtogether.js` — renderer mod (bulk of the changes)
- `src/patches.json` — bundle anchors (re-anchored for 0.5.4, new hooks)
- mirrors: `dist-package/src/*` and `workshop/content/src/*` (same content)

`src/st-main.js` unchanged.

---

## 1. Game build 0.5.4 compatibility (re-anchoring)
The 0.5.4 update moved/renamed several minified identifiers and changed some FH APIs. Re-anchored and added `0.5.4` to `supportedVersions`:
- **`building:place`** flipped from a cancelable event → interceptor → back to `!0===FH.events.emit(...)` across builds. Now handled via a **bundle patch** (`_place`) with multi-variant anchors, so it's robust to the flip-flop.
- **flamethrower** and **cryoblaster** hooks re-anchored for 0.5.4 (kept old variants as fallback).

## 2. Building placement (client) — was completely broken
- New bundle hook **`_place`** at the `building:place` dispatch site. Client forwards the placement intent; host builds authoritatively and mirrors it back.
- **Forward ALL structure types** (string *and* numeric enum). The previous `typeof === "string"` guard silently dropped the majority of buildings (numeric `ev` ids) → client placements never reached the host.
- **Load-flood guard** (`_loadGuardUntil`): loading a world re-fires `building:place` for every structure; we don't forward those for ~3s after a scene change.
- **`_applyingNet` guard restored** in `_place`: applying host-confirmed structures (`applyNetStructs → SA.build`) re-enters `building:place`; without the guard the client cancelled its own render → client saw *no* network structures.
- **Clearance fix**: forced builds now pass `clearance = J6.Available (1)` instead of the invalid `-1`, which 0.5.4 treated as corrupt/blocked → the structure was removed ("placed then vanished").
- **Worker propagation**: host now always propagates built structures to the sim workers (`SA.update({propagateToWorkers:true})`), otherwise the structure sat in the store but never rendered on the host.

## 3. Removal / reconcile — "placed then vanished"
- `applySnapshot` reconcile made **additive**: it no longer deletes local structures merely because they're absent from a snapshot (that was auto-deleting freshly placed structures). Real removals still come through the explicit `st rm` / `st mv` / demolish channels.

## 4. Construction ghost + remote cursor (preview channel)
- The `pos` message now carries the **mouse world position** and the **build intent** (structure type from `player.hotbar.bars[hotbarIndex][activeSlotIndex]` — `session.building.activeStructureType` is null on hover).
- Peers render a translucent **placement ghost** and a **grabber/vacuum reticle** in the player's color, so players can see where the other is about to build / is collecting.

## 5. worldId trust — mirror was being rejected
- Relaxed the world-mirror `worldId` check: once the client has received the host's world (`world-begin`) and both are in-world, it trusts the host's local worldId. Fixes `REJECT world` → mirror rejected → structures reconciled away.

## 6. Grabber & resources
- **Null crash fixed**: client no longer forwards `grabPick`/`grabPlace` with a null/0 element type (host `createAt(...,null)` was throwing ~900×/session and losing the element). Host guards too.
- **Element-type sync (mirror v3 → v4)**: the mirror now sends one element-type byte per cell and writes it into the client's `elementData.type[cellId - ELEMENTS_MIN]`. Without this, `getResolvedTypeFromCellId` returned null on the client → the grabber couldn't identify grabbable elements at all.
- **markCellDirty**: `FH.elements.createAt/removeAt` from the mod don't reliably set `chunkShouldUpdate`, so the mirror skipped those chunks. Grabber/vacuum ops now mark the affected chunk dirty (+ a priority lane) so results reach the client.
- **Grabber reworked host-side (vacuum model)** — the real fix for the scale wall (a grab touches up to 1024 cells on a paused client whose local writes are dropped, so it could never re-target cells it just touched):
  - New bundle hook **`_grab`** on the grabber function `z(e,t)`. Pick vs place is decided by the tank count `matrix[1]`.
  - **PICK** (tank empty): client forwards only its **aim** (`mouse.cellPosition`) — and only while actively grabbing (`action.state[qy.Active=2]`). Host harvests grabbable elements authoritatively (`getInfoAtPos`+`isGrabbable`+`removeAt`) and returns the types; client fills its tank. No more sentinel/mirror race.
  - **PLACE** (tank non-empty): unchanged (already works).

## Notes for review
- All anchors verified unique-in-bundle on 0.5.4.
- Diagnostic `log(...)` lines were used during development; a few remain (capped) and can be trimmed before release if desired.
