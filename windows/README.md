# EvE Conduit on native Windows

Runs EvE Conduit directly on Windows as Windows services, with no Docker and no WSL. **Everything is
installed into, and runs from, one folder you choose**: EvE Conduit, Python, the database server, the cache,
the web server, settings, logs and backups. Nothing goes to `Program Files`, and nothing is installed
system-wide (no winget, no Visual C++ or .NET installers).

Outside that folder, only Windows' own registrations change: the EvE Conduit services, one firewall rule,
the folder added to the system PATH (for the `conduit` command), the tray panel's sign-in entry and the
"Apps & features" entry. The uninstaller (`conduit uninstall`) removes all of them.

> **Status: experimental.** Built and tested component by component (see [Testing](#testing)), but
> not yet run on a real Windows machine. Two parts of the stack aren't officially supported on Windows
> by their makers (see [Limitations](#limitations)). For the most proven setup on Windows, use
> [Docker Desktop](../docs/install-docker.md#windows-with-docker-desktop).

## How it differs from Linux

| Piece | Linux | Native Windows (all inside the install folder) |
|---|---|---|
| Web app server | gunicorn | **waitress** (gunicorn can't run on Windows) |
| Background jobs | Celery, process pool | Celery, **thread pool** (the process pool can't run on Windows) |
| Cache and task queue | Redis | **Garnet**, Microsoft's Redis-compatible server, with its own private .NET runtime |
| Database | PostgreSQL / MariaDB packages | **portable** PostgreSQL 17 / MariaDB 11.8 builds |
| Process manager | Supervisor | **Windows services**, via WinSW |
| Web server and HTTPS | nginx + certbot | **Caddy** (automatic Let's Encrypt) |
| Admin command | `conduit` (bash) | `conduit` (PowerShell) |

## Installing

The step-by-step guide for installing, first login, day-to-day commands, backups, updating and uninstalling
is [docs/install-windows.md](../docs/install-windows.md). This page is the technical reference behind it:
what the installer does, the folder layout, the ports, doing it by hand and what has been tested.

## Choosing the install folder

The folder must be:

- a full path on a **fixed local drive**, not a network share or USB stick, and not the root of a
  drive (`D:\EvE-Conduit`, not `D:\`)
- **empty or new**, because the installer locks down its permissions
- outside `C:\Windows`, `C:\Users` and `C:\ProgramData`
- under 80 characters (Python packages add deep paths inside it, and Windows has a path-length limit)
- free of `& < > " ' % ; | * ?` (they break the service definitions or the PATH). Spaces are fine.
- on a drive with at least 5 GB free

## Ports

| Service | Default | Reachable from |
|---|---|---|
| Web server, HTTP (Caddy) | 80 | the internet |
| Web server, HTTPS (Caddy) | 443 | the internet |
| EvE Conduit application (waitress) | 8000 | this machine only (127.0.0.1) |
| Garnet cache and task queue | 6379 | this machine only |
| PostgreSQL / MariaDB | 5432 / 3306 | this machine only (only asked when EvE Conduit installs the database) |

The installer rejects ports that are invalid, chosen twice, already used by another program, or
inside a range Windows reserves (Hyper-V, WSL and Docker reserve some). It opens only the two web
ports in Windows Firewall.

**Web ports other than 80/443.** EVE's login callback and Let's Encrypt both use your *public*
address, so the installer asks how people reach the site:

- **Router forwards the standard ports (answer Y).** Public 80/443 go to your chosen ports. The site
  is `https://your-domain`, and HTTP visitors are redirected there.
- **Chosen ports are public (answer N).** The site is `https://your-domain:8443`. Let's Encrypt
  still needs public port 80 or 443 to reach this machine to issue a certificate; the installer
  warns you if neither will.

`conduit ports` shows what's in use. Changing ports after installing isn't automated yet. Edit
`config\conduit.env` (`CONDUIT_BIND`, `REDIS_URL`, `DATABASE_URL`), `config\Caddyfile`, and the port in
`services\conduit-garnet.xml`, then re-register that service (`services\conduit-garnet.exe uninstall`,
then `install`) and run `conduit restart`. For the database port, also change `port` in
`data\postgres\postgresql.conf` (or `data\mariadb\my.ini`).

## What the installer does

Every download is checked against a SHA-256 pinned in `scripts\Conduit.psm1`, and the install stops if
one doesn't match. Downloads and caches stay inside the install folder (`tmp`, `cache`).

1. Asks for the install folder and the ports, and shows a summary to confirm.
2. Downloads **uv**, **Caddy**, **Garnet**, the **.NET 10 runtime** (as a plain zip, used only by
   Garnet) and **WinSW** into `bin`.
3. Unpacks the **Visual C++ runtime DLLs** (`msvcp140.dll`, `vcruntime140*.dll`) from Microsoft's
   redistributable *without running or installing it*, and copies them next to the programs that need
   them. A clean Windows may not have them, and PostgreSQL and Garnet need them.
4. Installs **Python 3.12** with uv into `python`, and creates the virtualenv `venv`.
5. Sets up the **database server** from the portable build: PostgreSQL's server files (without pgAdmin)
   into `bin\postgres`, with the database in `data\postgres`; or MariaDB into `bin\mariadb` and
   `data\mariadb`. It listens on 127.0.0.1 only, and the administrator password is saved to
   `config\database-admin.txt`.
6. Copies the release to `releases\X.Y.Z`, points the `app` junction at it, writes `config\conduit.env`
   with fresh secrets and your ports, generates `config\Caddyfile`, and installs EvE Conduit, waitress and
   the plugins.
7. Locks down permissions: code and config are writable only by Administrators and SYSTEM. The
   services run as **Local Service**, which can read the code and config and write only to `data` and `logs`.
8. Registers the services (`conduit-postgres` or `conduit-mariadb`, `conduit-garnet`, `conduit-web`,
   `conduit-worker`, `conduit-beat` and `conduit-caddy`), creates the EvE Conduit database, runs the migrations
   and starts everything. Services start automatically at boot and restart if they crash.
9. Opens the web ports in Windows Firewall, and puts the `conduit` command on the PATH.
10. Adds EvE Conduit to **Apps & features**, and starts the **tray control panel**, which then starts
    whenever anyone signs in (skip with `-NoTray`; skipped automatically on Server Core).

### Folder layout (shown for `C:\EvE-Conduit`)

| Path | Contents |
|---|---|
| `app` | junction to the running release in `releases\X.Y.Z` |
| `venv`, `python` | Python environment |
| `bin\postgres` or `bin\mariadb` | the database server |
| `bin\garnet`, `bin\dotnet` | Garnet and its private .NET runtime |
| `bin\caddy`, `bin\uv`, `bin\winsw`, `bin\vcruntime` | web server, Python tool, service wrapper, Visual C++ DLLs |
| `config` | `conduit.env`, `plugins.txt`, `Caddyfile`, `database-admin.txt` |
| `data` | the database files, static files, Caddy certificates, scheduler state |
| `web` | the front end Caddy serves |
| `services` | WinSW service wrappers and their configs |
| `tray` | the tray control panel (readable by all users; no secrets) |
| `conduit.ps1`, `conduit.cmd`, `uninstall.ps1` | admin command and uninstaller |
| `logs` | one log per service, rotated at 10 MB |
| `backups` | `conduit backup` output (Administrators only) |
| `cache`, `tmp` | pip/uv caches and temporary files |

## Manual install

To do it by hand, follow the installer's steps above. Everything runs from the install folder:

- **Python:** `bin\uv\uv.exe python install 3.12` (with `UV_PYTHON_INSTALL_DIR=<folder>\python`), then
  `uv venv --seed --python 3.12 <folder>\venv`, then from the release folder
  `<folder>\venv\Scripts\python -m pip install .\backend waitress` (add `[mysql]` for MariaDB) and
  `pip install -r <folder>\config\plugins.txt`.
- **PostgreSQL:** unzip `pgsql\bin`, `pgsql\lib` and `pgsql\share` from the EDB binaries zip into
  `<folder>\bin\postgres`. Then run `initdb -D <folder>\data\postgres -U postgres --pwfile=... --encoding=UTF8
  --locale-provider=builtin --builtin-locale=C.UTF-8 --locale=C --auth=scram-sha-256 -c listen_addresses=127.0.0.1 -c port=5432`,
  and create the `conduit` user and database as in
  [the Linux guide, manual install step 6](../docs/install-linux.md#6-create-the-database).
- **Visual C++ DLLs:** if PostgreSQL or Garnet won't start with a missing `msvcp140.dll` or
  `vcruntime140.dll`, copy those DLLs next to their `.exe`.
- **Configuration:** copy `windows\config\conduit.env.example` to `<folder>\config\conduit.env` and fill it
  in. Generate `config\Caddyfile` from `windows\caddy\Caddyfile.template`.
- **Database setup:** `<folder>\venv\Scripts\python <folder>\app\windows\service\conduit_service.py manage migrate`,
  then the same with `collectstatic --noinput` and `conduit_init`.
- **Services:** for each `windows\winsw\<id>.xml`, replace the `{{...}}` placeholders, save it as
  `<folder>\services\<id>.xml` next to a copy of `WinSW-x64.exe` named `<id>.exe`, and run `<id>.exe install`.

## Tray control panel

A hexagon icon by the clock shows EvE Conduit's health at a glance:

| Icon | Meaning |
|---|---|
| Green | Healthy: every service runs **and** answers on its port |
| Amber | Needs attention: a background service (worker or scheduler) is stopped, or something is still starting |
| Red | Problem: the database, cache, application or web server is stopped or not answering |
| Grey | Checking, or EvE Conduit isn't installed |

It checks every 30 seconds and shows a notification when the health changes. The checks go beyond
"is the service running": the database must accept connections, Garnet must answer `PING`, the
application must answer its API, and Caddy must serve the site. This catches cases like the
application returning errors because the cache stopped.

Hover over the icon for a one-line summary. **Double-click** it for the status window (each component,
its port and details, with *Restart selected*, *Restart all*, *Open site* and *Show log*).
**Right-click** for:

- **Open site**, **Service status...**
- **Restart / Start / Stop all services** (Windows asks for administrator rights)
- **Back up now**, **Show web log** (administrator rights)
- **Close this panel**

The panel runs as the signed-in user and only reads service states and ports, so it needs no special
rights; anything that changes the services asks for administrator rights.

## Limitations

- **Celery doesn't officially support Windows.** EvE Conduit uses Celery's thread pool, which works on
  Windows, but problems specific to Windows may get no help from the Celery project.
- **Garnet stands in for Redis.** It's Microsoft's open-source, Redis-compatible server. Celery needs
  its Lua scripting, which the service enables (`--lua`). Garnet keeps the queue in memory, so tasks
  waiting at the moment of a restart are lost. That's harmless here: every EvE Conduit job is periodic and
  simply runs again.
- **Keep the machine on.** Set *Sleep: Never* and Windows Update active hours, as for any server.

## Testing

Tested so far:

- **The service launcher** (`service\conduit_service.py`) ran waitress, the Celery thread-pool worker and
  beat against **Garnet 2.2.0** and **PostgreSQL 17**. The cache, task queue, scheduler, the full
  static data import and live ESI calls all worked. That run was on Linux; waitress and Celery's thread
  pool are pure Python and should behave the same on Windows, but haven't been run there yet.
- **The generated Caddyfile** was run with Caddy 2.11.7 for every port setup (standard ports, custom
  ports with the router forwarding 80/443, custom public ports, plain HTTP) and for an install folder
  with spaces. Routes, redirects and caching headers were all checked.
- **The PostgreSQL setup options** (`initdb` with UTF-8, the built-in locale, a local-only listener, a
  custom port and password logins) were checked with the same PostgreSQL 17 on Linux.
- **The real Windows downloads** were checked against their publishers' checksums, and inspected. The
  Visual C++ DLL extraction ran against the real Microsoft redistributable (with 7-Zip standing in for
  Windows' `expand.exe`) and produced genuine x64 `msvcp140.dll` / `vcruntime140*.dll`. Extracting only
  PostgreSQL's server files from the real zip gives 139 MB, without pgAdmin.
- **The PowerShell scripts** were checked with PSScriptAnalyzer against the Windows PowerShell 5.1
  profile for Windows Server 2019, and their helpers are covered by Pester tests.

- **The tray panel's health checks** ran against real PostgreSQL, Garnet, the application and Caddy. They
  reported Healthy, then correctly reported Down when Garnet was stopped, including the application
  failing because of it. The Healthy / Needs attention / Problem rules are covered by Pester tests.

**Not tested yet:** a real run on Windows of `install.ps1`, `conduit.ps1`, `uninstall.ps1` and the
tray panel's window and icon (Windows Forms). That covers the WinSW services, running PostgreSQL/MariaDB
as Local Service, `expand.exe`, folder permissions, the registry entries and Windows Firewall. Do that on
a test VM before relying on it.

Developers can run the Windows tests on any OS:

```bash
python -m pytest windows/tests          # launcher
pwsh windows/tests/run-tests.ps1        # PowerShell module, ports, Caddyfile, service templates
pwsh windows/tests/lint.ps1             # PSScriptAnalyzer, Windows PowerShell 5.1 compatibility
# Also test the Visual C++ extraction against the real file (7-Zip stands in for expand.exe off Windows):
CONDUIT_TEST_VCREDIST=VC_redist.x64.exe CONDUIT_TEST_7Z=7z pwsh windows/tests/run-tests.ps1
```
