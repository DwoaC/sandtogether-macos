# SandTogether — macOS port

macOS port of the SandTogether co-op mod (upstream:
https://github.com/IronBamBam1990/sandtogether) for the Steam game
Sandustry (AppID 2764460). Mod JS is platform-neutral; the port work is
installation, launch, paths, and patch-anchor verification against the
macOS game build.

## Project knowledge bundle (OKF)

Durable project knowledge lives in `docs/knowledge/` (Open Knowledge
Format). Concepts are current-state truth.

- **Consume:** before working on any covered system, open
  `docs/knowledge/index.md`, match the task against concept `use_when`
  triggers, and read matching concepts. Subagent prompts touching covered
  systems must include this pointer. Concepts are accurate as of their
  `timestamp`, not live — verify paths, symbols, and constants against
  source before asserting them, and fix drift you find. Facts about the
  local game install (versions, buildids, paths) live outside this repo
  and change with Steam updates — always re-verify.
- **Declare:** every design spec includes a **Knowledge impact** section —
  which concepts this work changes, which new concept(s) it creates.
  Research a dead end and it still gets written down; negative results
  stop the next session repeating the search.
- **Maintain:** any change to covered behavior updates the concept in the
  same session, with its `timestamp` refreshed. New topic → new concept
  from the OKF plugin's templates. Validate with `/okf:okf-validate`.
