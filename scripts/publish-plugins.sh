#!/usr/bin/env bash
# Publish the plugins/ folder to github.com/EvE-Conduit/plugins (its main branch mirrors this folder).
#
#   scripts/publish-plugins.sh            push what's committed under plugins/
#   scripts/publish-plugins.sh --dry-run  show what would be pushed
#
# Then the "Plugin catalog" workflow of this repository builds catalog.json from it, pins every plugin to that
# commit, signs it and publishes it; installs see the new versions within a day (or on "Refresh catalog").
# With GITHUB_TOKEN set (Actions: write) the workflow starts right away; otherwise its hourly run picks it up.
# Bump a plugin's version in its pyproject.toml when it changes, or installs won't see it as an update.
set -euo pipefail

REMOTE=${PLUGINS_REMOTE:-https://github.com/EvE-Conduit/plugins.git}
BRANCH=plugins-publish
cd "$(git rev-parse --show-toplevel)"

[[ -z "$(git status --porcelain -- plugins)" ]] || { echo "Commit your changes under plugins/ first." >&2; exit 1; }
# A built front end must be committed, because installs don't run npm.
for dir in plugins/*/frontend; do
  [[ -d "$dir" ]] || continue
  pkg=$(dirname "$dir")
  ls "$pkg"/*/static/*/*.js >/dev/null 2>&1 || { echo "$pkg has no built bundle; run npm run build in $dir and commit it." >&2; exit 1; }
done

git subtree split --prefix=plugins -b "$BRANCH" >/dev/null
if [[ "${1:-}" == "--dry-run" ]]; then
  git log --oneline -5 "$BRANCH"
  git push --dry-run "$REMOTE" "$BRANCH:main"
else
  git push "$REMOTE" "$BRANCH:main"
  url=https://github.com/EvE-Conduit/Eve-conduit/actions/workflows/plugin-catalog.yml
  if [[ -n "${GITHUB_TOKEN:-}" ]] && curl -fsS -o /dev/null -X POST -H "Authorization: Bearer $GITHUB_TOKEN" \
      -H "Accept: application/vnd.github+json" -d '{"ref":"main"}' \
      https://api.github.com/repos/EvE-Conduit/Eve-conduit/actions/workflows/plugin-catalog.yml/dispatches; then
    echo "Pushed. The new catalog is published in a minute or two: $url"
  else
    echo "Pushed. The catalog is rebuilt within the hour, or start it now: $url (Run workflow)"
  fi
fi
