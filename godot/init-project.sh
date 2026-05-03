#!/usr/bin/env bash
# Initialize / refresh the Neon Defense Godot project (import cache, class DB).
# Usage: from repo root — bash godot/init-project.sh
#        GODOT=/path/to/Godot_v4.*_linux.x86_64 bash godot/init-project.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJ_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GODOT_BIN="${GODOT:-godot4}"

if ! command -v "$GODOT_BIN" >/dev/null 2>&1; then
  echo "Godot 4 not found. Install it and use one of:"
  echo "  • godot4 on PATH, or"
  echo "  • GODOT=/full/path/to/Godot_v4.*_linux.x86_64 $0"
  exit 1
fi

if [[ ! -f "$PROJ_DIR/project.godot" ]]; then
  echo "Missing project.godot in $PROJ_DIR"
  exit 1
fi

echo "Project: $PROJ_DIR"
echo "Using:   $("$GODOT_BIN" --version)"

export GODOT_SILENCE_ROOT_WARNING="${GODOT_SILENCE_ROOT_WARNING:-1}"

echo "Running headless filesystem scan (safe without a monitor)..."
"$GODOT_BIN" --headless --path "$PROJ_DIR" --quit-after 5

# SSH / CI: ship Web build to Vite's public/godot/ when export templates are installed.
if [[ "${GODOT_SKIP_WEB_EXPORT:-}" != "1" ]]; then
  TPL=""
  if [[ -d "$HOME/.local/share/godot/export_templates" ]]; then
    TPL="$(find "$HOME/.local/share/godot/export_templates" -maxdepth 2 -name 'web_nothreads_release.zip' -print 2>/dev/null | head -1 || true)"
  fi
  if [[ -n "$TPL" ]]; then
    OUT_DIR="$REPO_ROOT/public/godot"
    mkdir -p "$OUT_DIR"
    echo "Exporting Web (headless) -> $OUT_DIR/ ..."
    (cd "$PROJ_DIR" && "$GODOT_BIN" --headless --export-release "Web" "../public/godot/index.html")
    echo "Web export OK ($(wc -c <"$OUT_DIR/index.html" | tr -d ' ') bytes index.html)."
  else
    echo "Skipping Web export: no web_nothreads_release.zip under ~/.local/share/godot/export_templates/"
    echo "  Install templates: unzip Godot_v*_stable_export_templates.tpz then move templates/* into"
    echo "  ~/.local/share/godot/export_templates/<version>/   (folder name must match editor, e.g. 4.6.2.stable)"
  fi
fi

echo ""
echo "Done. Next steps:"
echo "  • Editor (needs X11 or Wayland):"
echo "      $GODOT_BIN --path \"$PROJ_DIR\" --editor"
echo "  • Import all assets then exit (editor + GUI):"
echo "      $GODOT_BIN --path \"$PROJ_DIR\" --editor --import --quit"
echo "  • Web export for React (needs export templates 4.6.x in ~/.local/share/godot/export_templates/):"
echo "      cd \"$PROJ_DIR\" && $GODOT_BIN --headless --export-release \"Web\" \"../public/godot/index.html\""
echo "  • Run game from CLI (needs display):"
echo "      $GODOT_BIN --path \"$PROJ_DIR\""
