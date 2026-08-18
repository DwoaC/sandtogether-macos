---
type: Gotcha
title: macOS game build lags the Windows build
description: The installed macOS Sandustry is 0.5.2 while upstream's recon targets 0.5.3 — patch anchors may not match the mac bundle.
tags: [versions, anchors, steam, macos]
use_when:
  - applying or re-anchoring patches.json on macOS
  - debugging a patch that fails to find its anchor
  - reporting game-build compatibility in a PR
timestamp: 2026-08-18T18:00:00Z
---

# macOS game build lags the Windows build

Verified 2026-08-18: the macOS Steam build is
`CFBundleShortVersionString` **0.5.2** (manifest buildid **24719878**),
while upstream's `RECON.md` was written against Windows **0.5.3**. The
platforms are not guaranteed to be on the same build.

**Confirmed real depot lag, not a stale install:** after forcing a Steam
update check on 2026-08-18, the manifest still shows buildid 24719878,
`StateFlags 4` (fully installed, nothing pending), version 0.5.2. The
latest macOS depot simply ships an older build than Windows.

## Why it bites

`src/patches.json` anchors are exact strings against a specific minified
`bundle.js`. A minifier re-run or code change between 0.5.2 and 0.5.3 can
change identifier names, so an anchor validated on Windows may miss (or,
worse, match somewhere unintended) on mac. Upstream already maintains
per-game-version anchor variants — the mac build may need its own set.

## Rule

Before any patch work: extract the mac `app.asar`, grep the actual
`dist/js/bundle.js` for each anchor, and record hit counts (must be
exactly 1). Never trust that Windows-validated anchors transfer. Re-check
game version after every Steam update (`plutil -p
"<Sandustry.app>/Contents/Info.plist" | grep ShortVersion` and buildid in
the appmanifest).

## Related

- [patching-system](../systems/patching-system.md) — how anchors work
- [game-install-macos](../systems/game-install-macos.md) — where to find the mac bundle and version
