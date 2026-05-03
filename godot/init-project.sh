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

echo "Running headless filesystem scan (safe without a monitor)..."
"$GODOT_BIN" --headless --path "$PROJ_DIR" --quit-after 5

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
