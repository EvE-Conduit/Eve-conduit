#!/usr/bin/env bash
# Build dist/evecsm-<version>.tar.gz: backend, modules, docs, deploy files and the prebuilt
# front end, so servers never need Node.js.
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION=$(python3 -c "import re;print(re.search(r'^version = \"(.+)\"', open('backend/pyproject.toml').read(), re.M)[1])")
NAME="evecsm-$VERSION"
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT

echo "Building front end..."
(cd frontend && npm ci --silent && npm run build --silent)
for mod in modules/*/frontend; do
  [[ -f "$mod/vite.config.ts" ]] || continue
  echo "Building $(basename "$(dirname "$mod")") front end..."
  (cd "$mod" && ../../../frontend/node_modules/.bin/tsc -p . && ../../../frontend/node_modules/.bin/vite build --logLevel warn)
done

mkdir -p "$STAGE/$NAME"
tar -c \
  --exclude '.venv' --exclude '__pycache__' --exclude '*.egg-info' --exclude 'staticfiles' --exclude 'build' \
  --exclude '*.sqlite3' --exclude '.pytest_cache' --exclude 'node_modules' --exclude '.ruff_cache' \
  backend modules deploy docs README.md requirements-modules.txt | tar -x -C "$STAGE/$NAME"
cp -a frontend/dist "$STAGE/$NAME/web"
echo "$VERSION" > "$STAGE/$NAME/VERSION"
mkdir -p dist
tar -czf "dist/$NAME.tar.gz" -C "$STAGE" "$NAME"
echo "dist/$NAME.tar.gz"
