# Plugins

EvE Conduit plugins live here. A plugin is what the code calls a **module**: an installable Python
package (with an optional front-end bundle) that adds pages, dashboard widgets, character-sheet tabs,
API routes, background jobs, search results, group rules and ESI scopes.

- Start a new plugin by copying [`modules/conduit-example`](../modules/conduit-example), which is a
  complete working example, into a folder here.
- How plugins plug into the core (events, notifications, settings, search, group rules) is in
  [docs/platform.md](../docs/platform.md); the module contract is in `backend/conduit/modules/base.py`.
- To install one, add its path, git URL or PyPI name to `requirements-modules.txt` (Docker) or run
  `conduit module install <package>` (bare metal), then switch it on under Administration → Modules.
