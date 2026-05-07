#!/usr/bin/env bash
# Auto-export Godot Web → public/godot/ before Vite build.
# Docker runs Godot in its own stage; locally we run this when godot4 exists.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

has_engine=false
if [[ -n "${GODOT:-}" && -x "${GODOT}" ]]; then
  has_engine=true
elif command -v godot4 >/dev/null 2>&1; then
  has_engine=true
fi

if [[ "$has_engine" == true ]]; then
  exec bash "$ROOT/godot/init-project.sh"
fi

if [[ "${GODOT_WEB_REQUIRED:-}" == "1" ]]; then
  echo "godot-web-export: godot4 not on PATH and GODOT is not set to an executable."
  echo "Install Godot 4.6.x Standard from https://godotengine.org/download/linux/"
  exit 1
fi

if [[ -f "$ROOT/public/godot/index.html" ]]; then
  echo "godot-web-export: skipping export (no godot4); keeping existing public/godot/"
  exit 0
fi

echo "godot-web-export: WARNING — no godot4 and empty public/godot/ (menu Godot link may 404)."
echo "  Install godot4 + export templates, or run a Docker build."
exit 0
