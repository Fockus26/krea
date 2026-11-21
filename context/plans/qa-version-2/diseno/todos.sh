#!/usr/bin/env bash
# Corre todos los repros del design-qa contra <base> (por defecto http://localhost:4303).
B="${1:-http://localhost:4303}"
cd "$(dirname "$0")/../.." || exit 1
for f in .qa/repro/[0-9]*.mjs; do printf "%s: " "$(basename "$f")"; node "$f" "$B" 2>&1 | tail -1; done
