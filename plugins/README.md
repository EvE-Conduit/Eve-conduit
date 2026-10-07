# Plugins

Everything beyond the core is a **plugin**: an installable Python package (with an optional front-end
bundle) that adds pages, dashboard widgets, character-sheet tabs, API routes, background jobs, search
results, group rules and ESI scopes.

- [`conduit-example`](conduit-example) is a complete working plugin. Copy it to start your own.
- How plugins hook into the core (events, notifications, per-user settings, search, group rules) is in
  [docs/platform.md](../docs/platform.md). The plugin contract is `conduit.plugins.Plugin` in
  `backend/conduit/plugins/base.py`; front ends use `definePlugin` from `@conduit/sdk`.

## Installing

- **From the website (Windows and bare metal):** Administration → Plugins → Browse lists the official plugins.
  Tick the ones you want and install them together; each can update itself when a new version is published.
  The install's updater (the same one that installs EvE Conduit updates) does the work within two minutes,
  takes a backup first and puts things back if anything fails. Plugins from other git repositories can be
  installed there too once the server owner sets `CONDUIT_PLUGIN_URLS=true` in the config file.
- **On the server:** add the package (PyPI name, git URL or path) to `requirements-plugins.txt` for Docker, or
  run `conduit plugin install <package>` on bare metal and Windows. Then switch it on under
  Administration → Plugins.

## Publishing (maintainers)

This folder is mirrored to [github.com/EvE-Conduit/plugins](https://github.com/EvE-Conduit/plugins), and that
repository is where installs get the catalog from.

1. Change a plugin here and bump its `version` in `pyproject.toml` (installs only update to a higher version).
   If it has a front end, run `npm run build` in its `frontend/` folder and commit the built bundle.
2. Describe it for the catalog in `[tool.conduit]` (name, icon, category, `min_conduit`, ESI scopes); see
   [`scripts/build_catalog.py`](scripts/build_catalog.py). `catalog = false` keeps a plugin out.
3. Commit, then run `scripts/publish-plugins.sh` from the main repository. It pushes this folder to the plugins
   repository and starts the main repository's
   [Plugin catalog workflow](https://github.com/EvE-Conduit/Eve-conduit/actions/workflows/plugin-catalog.yml),
   which builds `catalog.json` with every plugin pinned to that commit, signs it with the release key and
   publishes it on the `plugin-catalog` release. (It also runs hourly, so a missed start catches up.)
