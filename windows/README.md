# EVECSM on native Windows

Runs EVECSM directly on Windows as Windows services, with no Docker and no WSL. **Everything is
installed into, and runs from, one folder you choose**: EVECSM, Python, the database server, the cache,
the web server, settings, logs and backups. Nothing goes to `Program Files`, and nothing is installed
system-wide (no winget, no Visual C++ or .NET installers).

Outside that folder, only Windows' own registrations change: the EVECSM services, one firewall rule,
the folder added to the system PATH (for the `evecsm` command), the tray panel's sign-in entry and the
"Apps & features" entry. The [uninstaller](#uninstalling) removes all of them.

> **Status: experimental.** Built and tested component by component (see [Testing](#testing)), but
> not yet run on a real Windows machine. Two parts of the stack aren't officially supported on Windows
> by their makers (see [Limitations](#limitations)). For the most proven setup on Windows, use
> [Docker Desktop](../docs/install-windows-docker.md).

## How it differs from Linux

| Piece | Linux | Native Windows (all inside the install folder) |
|---|---|---|
| Web app server | gunicorn | **waitress** (gunicorn can't run on Windows) |
| Background jobs | Celery, process pool | Celery, **thread pool** (the process pool can't run on Windows) |
| Cache and task queue | Redis | **Garnet**, Microsoft's Redis-compatible server, with its own private .NET runtime |
| Database | PostgreSQL / MariaDB packages | **portable** PostgreSQL 17 / MariaDB 11.8 builds |
| Process manager | Supervisor | **Windows services**, via WinSW |
| Web server and HTTPS | nginx + certbot | **Caddy** (automatic Let's Encrypt) |
| Admin command | `evecsm` (bash) | `evecsm` (PowerShell) |

## Requirements

- Windows 10 1809+ / Windows 11, or Windows Server 2019+ (64-bit)
- 4 GB RAM (8 GB recommended), and 5 GB free on the drive you install to
- Internet access during installation (downloads about 500 MB of components)
- A domain pointing at this machine, with the web ports reachable from the internet (router port
  forwarding at home)

## Quick install

1. Download `evecsm-X.Y.Z-windows.zip`. In PowerShell, **unblock it before extracting** so Windows
   doesn't block the scripts:
   ```powershell
   Unblock-File $HOME\Downloads\evecsm-X.Y.Z-windows.zip
   Expand-Archive $HOME\Downloads\evecsm-X.Y.Z-windows.zip -DestinationPath $HOME\Downloads
   ```
2. Open **PowerShell as Administrator** and run:
   ```powershell
   cd $HOME\Downloads\evecsm-X.Y.Z-windows
   Set-ExecutionPolicy -Scope Process Bypass
   .\windows\install.ps1 -Domain auth.example.com -Email you@example.com
   ```
3. Answer the questions (press Enter to accept each suggestion):
   ```
   Where should EVECSM be installed?
   Install folder [C:\EVECSM]: D:\EVECSM

   Which ports should EVECSM use? Press Enter to keep the suggested port.
     Web server, HTTP (public) [80]:
     Web server, HTTPS (public) [443]:
     EVECSM application (this machine only) [8000]:
     Garnet cache and task queue (this machine only) [6379]:
     Postgres database (this machine only) [5432]:
   ```
   If you choose web ports other than 80/443, it also asks whether your router forwards the standard
   ports to them (see [Ports](#ports)). It then shows a summary and asks you to confirm.
4. The installer prints a **setup code**. Register the EVE application with the callback URL it shows,
   put the Client ID and Secret Key in `<install folder>\config\evecsm.env`, then run
   `evecsm restart` in an Administrator terminal.
5. Open your site, sign in with your main character and enter the setup code.

**Options:**
- `-Database MariaDB` installs MariaDB instead of PostgreSQL.
- `-DatabaseUrl postgres://...` uses an existing database server instead of installing one.
- `-NoTls` serves plain HTTP (on a LAN, or behind another proxy).
- `-EsiClientId` / `-EsiSecret` set the EVE application details up front.
- `-InstallRoot`, `-HttpPort`, `-HttpsPort`, `-AppPort`, `-CachePort`, `-DatabasePort` and
  `-PublicPorts Standard|AsChosen` answer the questions in advance.
- `-Yes` asks nothing. It requires `-InstallRoot`; any ports not given use the defaults.

## Choosing the install folder

The folder must be:

- a full path on a **fixed local drive**, not a network share or USB stick, and not the root of a
  drive (`D:\EVECSM`, not `D:\`)
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
| EVECSM application (waitress) | 8000 | this machine only (127.0.0.1) |
| Garnet cache and task queue | 6379 | this machine only |
| PostgreSQL / MariaDB | 5432 / 3306 | this machine only (only asked when EVECSM installs the database) |

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

`evecsm ports` shows what's in use. Changing ports after installing isn't automated yet. Edit
`config\evecsm.env` (`EVECSM_BIND`, `REDIS_URL`, `DATABASE_URL`), `config\Caddyfile`, and the port in
`services\evecsm-garnet.xml`, then re-register that service (`services\evecsm-garnet.exe uninstall`,
then `install`) and run `evecsm restart`. For the database port, also change `port` in
`data\postgres\postgresql.conf` (or `data\mariadb\my.ini`).

## What the installer does

Every download is checked against a SHA-256 pinned in `scripts\Evecsm.psm1`, and the install stops if
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
6. Copies the release to `releases\X.Y.Z`, points the `app` junction at it, writes `config\evecsm.env`
   with fresh secrets and your ports, generates `config\Caddyfile`, and installs EVECSM, waitress and
   the modules.
7. Locks down permissions: code and config are writable only by Administrators and SYSTEM. The
   services run as **Local Service**, which can read the code and config and write only to `data` and `logs`.
8. Registers the services (`evecsm-postgres` or `evecsm-mariadb`, `evecsm-garnet`, `evecsm-web`,
   `evecsm-worker`, `evecsm-beat` and `evecsm-caddy`), creates the EVECSM database, runs the migrations
   and starts everything. Services start automatically at boot and restart if they crash.
9. Opens the web ports in Windows Firewall, and puts the `evecsm` command on the PATH.
10. Adds EVECSM to **Apps & features**, and starts the **tray control panel**, which then starts
    whenever anyone signs in (skip with `-NoTray`; skipped automatically on Server Core).

### Folder layout (shown for `C:\EVECSM`)

| Path | Contents |
|---|---|
| `app` | junction to the running release in `releases\X.Y.Z` |
| `venv`, `python` | Python environment |
| `bin\postgres` or `bin\mariadb` | the database server |
| `bin\garnet`, `bin\dotnet` | Garnet and its private .NET runtime |
| `bin\caddy`, `bin\uv`, `bin\winsw`, `bin\vcruntime` | web server, Python tool, service wrapper, Visual C++ DLLs |
| `config` | `evecsm.env`, `modules.txt`, `Caddyfile`, `database-admin.txt` |
| `data` | the database files, static files, Caddy certificates, scheduler state |
| `web` | the front end Caddy serves |
| `services` | WinSW service wrappers and their configs |
| `tray` | the tray control panel (readable by all users; no secrets) |
| `evecsm.ps1`, `evecsm.cmd`, `uninstall.ps1` | admin command and uninstaller |
| `logs` | one log per service, rotated at 10 MB |
| `backups` | `evecsm backup` output (Administrators only) |
| `cache`, `tmp` | pip/uv caches and temporary files |

## Manual install

To do it by hand, follow the installer's steps above. Everything runs from the install folder:

- **Python:** `bin\uv\uv.exe python install 3.12` (with `UV_PYTHON_INSTALL_DIR=<folder>\python`), then
  `uv venv --seed --python 3.12 <folder>\venv`, then from the release folder
  `<folder>\venv\Scripts\python -m pip install .\backend waitress` (add `[mysql]` for MariaDB) and
  `pip install -r <folder>\config\modules.txt`.
- **PostgreSQL:** unzip `pgsql\bin`, `pgsql\lib` and `pgsql\share` from the EDB binaries zip into
  `<folder>\bin\postgres`. Then run `initdb -D <folder>\data\postgres -U postgres --pwfile=... --encoding=UTF8
  --locale-provider=builtin --builtin-locale=C.UTF-8 --locale=C --auth=scram-sha-256 -c listen_addresses=127.0.0.1 -c port=5432`,
  and create the `evecsm` user and database as in
  [the bare-metal guide, step 6](../docs/install-baremetal.md#6-create-the-database).
- **Visual C++ DLLs:** if PostgreSQL or Garnet won't start with a missing `msvcp140.dll` or
  `vcruntime140.dll`, copy those DLLs next to their `.exe`.
- **Configuration:** copy `windows\config\evecsm.env.example` to `<folder>\config\evecsm.env` and fill it
  in. Generate `config\Caddyfile` from `windows\caddy\Caddyfile.template`.
- **Database setup:** `<folder>\venv\Scripts\python <folder>\app\windows\service\evecsm_service.py manage migrate`,
  then the same with `collectstatic --noinput` and `evecsm_init`.
- **Services:** for each `windows\winsw\<id>.xml`, replace the `{{...}}` placeholders, save it as
  `<folder>\services\<id>.xml` next to a copy of `WinSW-x64.exe` named `<id>.exe`, and run `<id>.exe install`.

## Running EVECSM

In an **Administrator** terminal:

| Task | Command |
|---|---|
| Status and ports | `evecsm status` |
| Ports only | `evecsm ports` |
| Restart (e.g. after editing `evecsm.env`) | `evecsm restart` (or `evecsm restart web`) |
| Follow a log | `evecsm logs web` (or `worker`, `beat`, `caddy`, `garnet`, `postgres`/`mariadb`) |
| Any Django command | `evecsm manage <command>` |
| Setup code again | `evecsm setup-code` |
| Back up database and config | `evecsm backup` |
| Install a module | `evecsm module install evecsm-something` |
| List modules | `evecsm module list` |

| Open the tray control panel | `evecsm tray` (`evecsm tray on` / `off`: start it at sign-in or not) |
| Remove EVECSM | `evecsm uninstall` |

The services also show up in **services.msc** as "EVECSM ...".

## Tray control panel

A hexagon icon by the clock shows EVECSM's health at a glance:

| Icon | Meaning |
|---|---|
| Green | Healthy: every service runs **and** answers on its port |
| Amber | Needs attention: a background service (worker or scheduler) is stopped, or something is still starting |
| Red | Problem: the database, cache, application or web server is stopped or not answering |
| Grey | Checking, or EVECSM isn't installed |

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

## Uninstalling

Use **Settings → Apps → EVECSM → Uninstall**, or in an Administrator terminal:

```powershell
evecsm uninstall
```

It asks what to remove:

1. **Everything**, including the database. It first offers to save a final backup to a folder you
   choose outside the install folder, then asks you to type `DELETE`.
2. **The programs only.** It keeps `config` (settings and passwords), `data` (the database files) and
   `backups` in the install folder.

It then closes the tray panel, stops and removes the services, removes the firewall rule, the PATH
entry, the sign-in entry and the Apps & features entry, and deletes the files. Anything it can't remove
(say, a file still in use) is listed at the end.

For scripts: `evecsm uninstall -Mode All -BackupTo D:\Backups -Yes` (or `-Mode KeepData`, `-NoBackup`).

## Updating

```powershell
Unblock-File .\evecsm-X.Y.Z-windows.zip
evecsm upgrade .\evecsm-X.Y.Z-windows.zip
```

This backs up first, stops the app (Windows locks files that are in use), installs the new release
next to the old one, migrates, publishes the new front end and starts everything again. If installing
fails, it puts the running release back and restarts it. If an upgrade stops half-way after switching releases (e.g. a service was down), fix the cause and run
`evecsm repair` to redo the remaining steps. `evecsm rollback` returns to the previous
release; database migrations aren't undone, so restore the backup if the old version won't start.

## Limitations

- **Celery doesn't officially support Windows.** EVECSM uses Celery's thread pool, which works on
  Windows, but problems specific to Windows may get no help from the Celery project.
- **Garnet stands in for Redis.** It's Microsoft's open-source, Redis-compatible server. Celery needs
  its Lua scripting, which the service enables (`--lua`). Garnet keeps the queue in memory, so tasks
  waiting at the moment of a restart are lost. That's harmless here: every EVECSM job is periodic and
  simply runs again.
- **Keep the machine on.** Set *Sleep: Never* and Windows Update active hours, as for any server.

## Testing

Tested so far:

- **The service launcher** (`service\evecsm_service.py`) ran waitress, the Celery thread-pool worker and
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

**Not tested yet:** a real run on Windows of `install.ps1`, `evecsm.ps1`, `uninstall.ps1` and the
tray panel's window and icon (Windows Forms). That covers the WinSW services, running PostgreSQL/MariaDB
as Local Service, `expand.exe`, folder permissions, the registry entries and Windows Firewall. Do that on
a test VM before relying on it.

Developers can run the Windows tests on any OS:

```bash
python -m pytest windows/tests          # launcher
pwsh windows/tests/run-tests.ps1        # PowerShell module, ports, Caddyfile, service templates
pwsh windows/tests/lint.ps1             # PSScriptAnalyzer, Windows PowerShell 5.1 compatibility
# Also test the Visual C++ extraction against the real file (7-Zip stands in for expand.exe off Windows):
EVECSM_TEST_VCREDIST=VC_redist.x64.exe EVECSM_TEST_7Z=7z pwsh windows/tests/run-tests.ps1
```
