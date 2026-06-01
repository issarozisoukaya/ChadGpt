#!/usr/bin/env bash
# Usage (from chadgpt-admin repo root): chmod +x scripts/deploy-push-main.sh && ./scripts/deploy-push-main.sh "fix: admin"
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
MSG="${1:-chore: deploy admin}"
if [[ -z "$(git status --porcelain)" ]]; then
  echo "Nothing to commit."
  git push origin main
  exit 0
fi
git add -A
git commit -m "$MSG"
git push origin main
echo "Done. Cloudflare Pages will build if connected to this repo."
