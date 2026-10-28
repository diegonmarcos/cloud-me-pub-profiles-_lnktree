#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# front-qrcode-gen.sh
#
# Engine helper for the `qrcode_gen` build.json mod. Runs the project's
# TypeScript QR-code generator (src/typescript/qrcode/qr-code-generator.ts)
# against a manifest JSON, emitting:
#   • vCard 3.0 files declared in manifest.vcfFiles (default: src/public/*.vcf)
#   • Styled QR PNGs declared in manifest.qrcodes      (default: src/public/qr-code-*.png)
#   • The data-driven qrcode.html (default: src/qrcode.html)
#
# Uses the system `tsc` (installed via nix on the build server) then runs
# the compiled output with `node`. The project's package.json declares
# qr-code-styling + qrcode + sharp + jsdom in devDependencies.
#
# Usage:
#     qrcode-gen.sh <project_dir> [manifest_rel_path]
#
#     <project_dir>      — absolute path to the project (contains build.json)
#     [manifest_rel_path]— relative to project_dir;
#                          default: src/typescript/qrcode/qrcodes.json
#
# Exit codes:
#     0 — success
#     1 — bad usage / project layout / tsc missing
#     2 — generator script failed
# ──────────────────────────────────────────────────────────────────────
set -euo pipefail

PROJECT="${1:-}"
MANIFEST_REL="${2:-src/typescript/qrcode/qrcodes.json}"

[ -n "$PROJECT" ] || { echo "✗ usage: front-qrcode-gen.sh <project_dir> [manifest_rel_path]" >&2; exit 1; }
[ -d "$PROJECT" ] || { echo "✗ project dir not found: $PROJECT" >&2; exit 1; }

GENERATOR="$PROJECT/src/typescript/qrcode/qr-code-generator.ts"
MANIFEST="$PROJECT/$MANIFEST_REL"

[ -f "$GENERATOR" ] || { echo "✗ qrcode generator not found: $GENERATOR" >&2; exit 1; }
[ -f "$MANIFEST" ]  || { echo "✗ qrcode manifest not found: $MANIFEST" >&2; exit 1; }

TSC_BIN="$(command -v tsc 2>/dev/null)"
if [ -z "$TSC_BIN" ]; then
    echo "⚠ tsc not found in PATH — skipping QR regeneration (existing src/public/qr-code-*.png will be used). Install typescript via the system package manager to enable regeneration." >&2
    exit 0
fi

# Resolve the repo root to find the shared node_modules.
# The compiled output lands in a temp dir; ESM does NOT use NODE_PATH,
# so we symlink node_modules into the temp dir so node's upward-walking
# package resolution finds jsdom, sharp, qrcode, etc.
REPO_ROOT="$(git -C "$PROJECT" rev-parse --show-toplevel 2>/dev/null || true)"
NODE_MODULES_SRC=""
if [ -n "$REPO_ROOT" ] && [ -d "$REPO_ROOT/node_modules" ]; then
    NODE_MODULES_SRC="$REPO_ROOT/node_modules"
elif [ -d "$PROJECT/node_modules" ]; then
    NODE_MODULES_SRC="$PROJECT/node_modules"
fi

# Compile the generator to a temp dir and run with node.
TMP_OUT="$(mktemp -d)"
trap 'rm -rf "$TMP_OUT"' EXIT

# Symlink node_modules into the temp dir so ESM package resolution works.
# ESM walks up from the compiled file's directory looking for node_modules;
# without this symlink it would reach / without finding any packages.
if [ -n "$NODE_MODULES_SRC" ]; then
    ln -s "$NODE_MODULES_SRC" "$TMP_OUT/node_modules"
fi

"$TSC_BIN" \
    --target ES2020 \
    --module node16 \
    --moduleResolution node16 \
    --esModuleInterop true \
    --skipLibCheck true \
    --outDir "$TMP_OUT" \
    "$GENERATOR"

# Invoke the compiled generator. The generator's PROJECT_ROOT is computed
# from its own __dirname, so we pass it the original source path so it
# resolves assets relative to the project root correctly.
(
    cd "$PROJECT"
    node "$TMP_OUT/qr-code-generator.js" --manifest="$MANIFEST_REL"
)
