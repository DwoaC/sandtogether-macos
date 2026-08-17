# Co-op architecture plan — SandTogether

*Translated from the original Polish notes.*

Date: 2026-08-16. Based on: REKONESANS.md, MAPA_BUNDLE.md, MAPA_WORKERY.md.

## Architectural decision (MADE)

**Host-authoritative co-op for 2+ players.** Lockstep is definitively out: 83 × `Math.random()` in the physics path, random neighbor shuffling, non-deterministic chunk claiming order (work stealing on Atomics), worker count dependent on CPU.

- **Host**: runs the full simulation (unchanged). Authority over the world, resources, structures.
- **Client**: its own simulation is **PAUSED** (`SetPaused` / speed 0). The world is updated with chunk diffs from the host written straight into the SAB. The player's own movement is computed LOCALLY (prediction — player physics runs on the main thread, self-contained, `bundle:~47040`) on reasonably fresh terrain.
- **Transport v1**: WebSocket (host opens a server in the Electron process — full Node). LAN / Tailscale / VPS relay.
- **Transport v2**: Steam P2P + lobby via steamworks.js (already bundled with the game, 0.3.1).

## Synchronization channels

1. **Player positions** (60 Hz, tiny): hook on the `player:moved` event + `shared.playerPos`. Remote players = ghosts drawn via the Sandkit API (`player.getPosition` exists for the local player; remote ones we draw ourselves in the Pixi layer / via `frame:update`).
2. **Player actions → host** (event-driven): the client does NOT execute actions locally; it only sends them to the host. Interception points:
   - `input:*` events (bundle 74918-74936 — a listener returning truthy cancels the default handling!)
   - mutationSync queue (`bundle:52636-52719`, exports `Lu/f6/dt`) — the choke point of all writes to the world
   - opcode messages (Dig=5, Blast=4, AddStructure=7, ...) — mirrored in `post/postAll` (`bundle:74529-74534`); every mutation is already a serializable `[opcode, args]` array
3. **World → clients** (10–20 Hz): the host collects dirty chunks (`chunkShouldUpdate`, chunk=40x40), serializes `cellIds`+`elementData` for the chunk's cells (or, simpler for v1: reconstructs the types into a "material per cell" form), compresses (RLE + deflate — sand compresses extremely well), sends. Interest management: chunks in the players' viewports first, the rest more slowly.
4. **Store delta** (1–5 Hz): resources, structures[], drones[], worldItems[], productionPoints — JSON diff against the previous snapshot.
5. **Join snapshot**: a ready-made serializer = the Save path → `UtilitySave` (utility:39229-39320) produces `{store, wall, matrix, shadow, authorization}`; the client loads it like a save (`S(e)` bundle:10492-10560). Zero serialization work of our own!

## Mod structure (Fluxloader)

```
sandtogether/
  modinfo.json          # modID, entrypoints, configSchema (port, nick, host/join)
  entry.electron.js     # main process: WebSocket server/client, Steam P2P (v2), relay IPC
  entry.game.js         # renderer: input/player:moved/frame:update hooks, ghost rendering,
                        #   applying diffs to the SAB via mutationSync, UI (Host/Join menu)
  entry.worker.js       # (optional) hooks in the manager: tap on the be() loop as a network tick,
                        #   collecting dirty chunks on the host side
```

Note: `RegisterManagerTrigger` does `new Function(...)` in the manager worker (`manager:1083`) — a legitimate code injection point into the 60 Hz loop without patching the worker file.

## Milestones

- **M0 — Foundation** (half a day): Fluxloader installed and working on EA (watch out for the "Mods" branch in Steam Beta). Hello-world mod: logs `fl:game-started`, `fl:scene-loaded`, input events. Verification that patches and the 3 contexts work.
- **M1 — Network pipe** (1 day): entry.electron.js opens a WS server (host) / connects (client). Handshake, nicknames, ping. In-game UI: Host / Join+IP button (initially this can be a config entry in modinfo or a hotkey).
- **M2 — Ghosts** (1-2 days): player positions at 60 Hz in both directions, the remote player rendered in both the host's and the client's world. **First "wow moment": we can see each other.** (The world is not yet synchronized — both play on the same map from the same save.)
- **M3 — Shared world** (3-5 days, the hardest part): the client pauses its sim; join snapshot via the save path; client actions → host (intercepting input/mutationSync); host → dirty chunks + store delta. This is where all the gotchas will surface (elementData realloc, blockGrid consistency, structures).
- **M4 — Playability** (2-3 days): interest management (viewport), compression, smoothness (ghost interpolation), disconnect/reconnect handling, co-op HUD (who's online, pings).
- **M5 — Steam** (2-3 days): lobby + P2P via steamworks.js from the game process, "Join friend" from the friends list, Workshop publication.

## Risks / unknowns

- Whether pausing the sim on the client also freezes particle/animation rendering (may require separating the visual pause from the sim pause).
- Size of chunk diffs during large cataclysms (lava/flood) — may require prioritization + degradation to keyframes.
- Versioning: the mod must enforce game version compatibility (0.5.3) — patches against minified identifiers break on game updates.
- Achievements/integrity: `store.integrity.modsUsed` — the game marks the save as modded; we leave that alone, playing fair.
- EA has only just launched — the devs may announce MP themselves; check the roadmap before going deep into M3+.

## Current status

- [x] Reconnaissance of the game code (maps in MAPA_BUNDLE.md, MAPA_WORKERY.md)
- [x] Architecture decision: host-authoritative
- [ ] M0: Fluxloader installation (WAITING ON THE USER: Workshop subscription / Mods branch)
- [ ] M0: hello-world mod
