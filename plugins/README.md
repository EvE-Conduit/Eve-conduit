# Plugins

Everything beyond the core is a **plugin**: an installable Python package (with an optional front-end
bundle) that adds pages, dashboard widgets, character-sheet tabs, API routes, background jobs, search
results, group rules and ESI scopes.

- [`conduit-example`](conduit-example) is a complete working plugin. Copy it to start your own.
- How plugins hook into the core (events, notifications, per-user settings, search, group rules) is in
  [docs/platform.md](../docs/platform.md). The plugin contract is `conduit.plugins.Plugin` in
  `backend/conduit/plugins/base.py`; front ends use `definePlugin` from `@conduit/sdk`.
- Installing: add the package (PyPI name, git URL or path) to `requirements-plugins.txt` for Docker, or
  run `conduit plugin install <package>` on bare metal and Windows. Then switch it on under
  Administration → Plugins.
