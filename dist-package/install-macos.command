#!/bin/bash
# ============================================================================
# SandTogether - co-op multiplayer mod for Sandustry
# Author / Autor: KAMIL PADULA
# macOS installer. No dependencies: uses the game's own Electron as Node.
# Run:  double-click this file, or in Terminal:  bash install-macos.command
# ============================================================================
set -u
echo ""
echo "=== SandTogether installer (macOS) — by Kamil Padula ==="
echo ""

MOD_DIR="$(cd "$(dirname "$0")" && pwd)"

# --- 1. find Steam libraries -------------------------------------------------
LIBS=("$HOME/Library/Application Support/Steam")
VDF="$HOME/Library/Application Support/Steam/steamapps/libraryfolders.vdf"
if [ -f "$VDF" ]; then
  while IFS= read -r p; do LIBS+=("$p"); done < <(grep -o '"path"[[:space:]]*"[^"]*"' "$VDF" | sed 's/.*"path"[[:space:]]*"//; s/"$//')
fi

GAME=""
for L in "${LIBS[@]}"; do
  C="$L/steamapps/common/Sandustry"
  if [ -d "$C" ]; then GAME="$C"; break; fi
done
if [ -z "$GAME" ]; then
  echo "Game not found automatically."
  read -r -p "Enter the Sandustry folder path (steamapps/common/Sandustry): " GAME
  [ -d "$GAME" ] || { echo "ERROR: folder not found: $GAME"; exit 1; }
fi

APP_BUNDLE="$(/bin/ls -d "$GAME"/*.app 2>/dev/null | head -1)"
[ -n "$APP_BUNDLE" ] || { echo "ERROR: no .app bundle inside $GAME"; exit 1; }
RES="$APP_BUNDLE/Contents/Resources"
BIN_NAME="$(/bin/ls "$APP_BUNDLE/Contents/MacOS" | head -1)"
ELECTRON="$APP_BUNDLE/Contents/MacOS/$BIN_NAME"
[ -x "$ELECTRON" ] || { echo "ERROR: game binary not found at $ELECTRON"; exit 1; }
echo "Game: $APP_BUNDLE"

# --- 2. close the game -------------------------------------------------------
pkill -f "$BIN_NAME" 2>/dev/null || true
sleep 1

# --- 3. run the install payload using the game's own Electron as Node --------
ELECTRON_RUN_AS_NODE=1 "$ELECTRON" "$MOD_DIR/install-macos.js" "$RES" "$MOD_DIR" || { echo "ERROR: install payload failed"; exit 1; }

# --- 4. Gatekeeper: the app is modified now -> drop quarantine + ad-hoc sign --
xattr -dr com.apple.quarantine "$APP_BUNDLE" 2>/dev/null || true
codesign --force --deep --sign - "$APP_BUNDLE" 2>/dev/null && echo "[+] ad-hoc re-signed" || echo "[!] codesign skipped (usually fine)"

echo ""
echo "=== DONE! Launch Sandustry from Steam. ==="
echo "The SandTogether panel appears in the top-right corner."
echo "From v0.9.39 the mod auto-updates itself at every game launch - you never run this again."
read -r -p "Press Enter to close"
