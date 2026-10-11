# Installing EvE Conduit on Windows

This guide installs EvE Conduit directly on Windows, as Windows services, with no Docker and no WSL.
A setup wizard (`EvE-Conduit-Setup-X.Y.Z.exe`) does the whole install. Everything is installed into,
and runs from, one folder you choose: EvE Conduit, Python, the database server, the cache, the web server,
settings, logs and backups. Nothing goes to `Program Files` and nothing is installed system-wide.

> **Status: experimental.** The Windows install has been built and tested component by component, but
> has not yet been run end to end on a real Windows machine, and two parts of the stack (Celery and the
> Garnet cache) are not officially supported on Windows by their makers. Try it on a test machine first.
> For the most proven setup on a Windows PC, run the Linux containers with Docker Desktop instead:
> see [the Docker guide](install-docker.md#windows-with-docker-desktop).

Technical details (how it differs from Linux, every step the installer takes, the folder layout, doing
it by hand) are in [windows/README.md](../windows/README.md).

**How long it takes:** 15 to 30 minutes.

## What you get

| Piece | What is used |
|---|---|
| Application | Python 3.12 in a virtualenv, served by waitress |
| Database | a portable PostgreSQL 17 (recommended) or MariaDB 11.8 |
| Cache and job queue | Garnet, Microsoft's Redis-compatible server |
| Background jobs | a Celery worker and Celery beat (the scheduler) |
| Web server and HTTPS | Caddy, with a free Let's Encrypt certificate it renews itself |
| Services | `conduit-postgres` (or `-mariadb`), `conduit-garnet`, `conduit-web`, `conduit-worker`, `conduit-beat`, `conduit-caddy`; they start at boot and restart if they crash |
| Admin command | `conduit` in any Administrator terminal |
| Tray control panel | an icon by the clock showing the site's health, with restart, backup and logs |
| Updates | approved on the website, installed by a scheduled task running as SYSTEM |

## What you need

- **Windows 10 version 1809 or newer, Windows 11, or Windows Server 2019 or newer**, 64-bit.
- **An administrator account** on the machine.
- **4 GB RAM** (8 GB recommended) and **5 GB free** on the drive you install to.
- **Internet access during the install** (it downloads about 500 MB of components).
- **A domain name** (for example `auth.example.com`) with a DNS **A record** pointing at your public IP
  address, and **TCP ports 80 and 443 reachable** from the internet. At home that means forwarding both
  ports on your router to this PC. **No domain?** See [Using an IP address instead of a domain](#using-an-ip-address-instead-of-a-domain).
- **A PC that stays on.** EvE Conduit is a website; members cannot sign in while the PC sleeps.
- **An EVE Online account** to sign in with. The first person to sign in and enter the setup code
  becomes the administrator.

## 1. Point your domain at this machine

1. Find your public IP address (search "what is my IP" in a browser).
2. In your DNS provider's control panel, create an **A record** for your chosen name (for example
   `auth.example.com`) with that address.
3. At home, log in to your router and forward **TCP 80** and **TCP 443** to this PC's local address
   (shown by `ipconfig` as *IPv4 Address*). Give the PC a fixed local address in the router (often called
   a DHCP reservation) so the forwarding keeps working after a reboot.

DNS changes can take a few minutes. Check in PowerShell with `Resolve-DnsName auth.example.com`; it should
print your public IP.

## 2. Register an EVE application

EvE Conduit signs people in through EVE's official login (SSO). Each site registers its own application
with CCP. You can do this before or after the install; the wizard asks for the details but works without
them.

1. Go to <https://developers.eveonline.com/applications> and sign in with your EVE account.
2. Click **Create new application**.
3. Name and description: anything, for example your corporation's name. Members see the name when they
   sign in.
4. Connection type: **Authentication & API Access**.
5. **Permissions (scopes): select every scope.** EvE Conduit asks members for all of them at sign-in so
   that no feature has to ask again later. A scope that is missing here makes the EVE login fail with
   `invalid_scope`.
6. **Callback URL:** exactly `https://auth.example.com/sso/callback`, with your own domain. No trailing
   slash. (If you choose plain HTTP in the wizard, it starts with `http://`.)
7. Create the application, then open it and copy the **Client ID** and **Secret Key**.

## 3. Run the setup wizard

1. Download **`EvE-Conduit-Setup-X.Y.Z.exe`** (the newest version) from
   <https://github.com/EvE-Conduit/Eve-conduit/releases>.
2. Run it. Windows asks for administrator rights. The setup is not code-signed yet, so SmartScreen may
   show **Windows protected your PC**: click **More info**, then **Run anyway**.
3. Answer the wizard's pages. Press **Next** to accept the suggestion on any page you are unsure about.

   | Page | What to enter |
   |---|---|
   | **Install folder** | Where everything goes. The default `C:\EvE-Conduit` is fine. It must be a new or empty folder on a fixed local drive, not the root of a drive, outside `C:\Windows`, `C:\Users` and `C:\ProgramData`, under 80 characters and without `& < > " ' % ; \| * ?`. |
   | **Your site** | Your domain name (`auth.example.com`) or public IP address, and your email address. The email goes to Let's Encrypt and into the User-Agent EvE Conduit sends to CCP, which asks every ESI application to identify its operator. |
   | **Connection** | **HTTPS with a free, automatic Let's Encrypt certificate** (recommended). Choose plain HTTP only for a test on your own network or behind another proxy that does HTTPS. |
   | **Database** | **PostgreSQL** (recommended) or MariaDB. |
   | **Ports** | Keep the defaults (80, 443, 8000, 6379 and 5432 or 3306) unless another program already uses one; the wizard checks and tells you. Only the two web ports are reachable from outside. |
   | **Public ports** | Only shown if you changed the web ports. Say whether your router forwards the public 80 and 443 to them (the address stays `https://auth.example.com`), or members use the chosen ports directly (the address becomes `https://auth.example.com:8443`, for example). |
   | **EVE Online login** | The Client ID and Secret Key from step 2. Optional: leave them empty to add them later. The page shows the callback URL to register. |

4. The **Ready** page lists your answers. The wizard checks the folder, the domain and every port on
   the real machine before it lets you continue.
5. **Install** takes 5 to 15 minutes. The progress bar moves through each step: downloading the
   components, installing Python, setting up the database, installing EvE Conduit, creating the services
   and starting them.
6. The **finish page** shows your site's address and the one-time **setup code**. Write the code down.
   (You can print it again later with `conduit setup-code` in an Administrator terminal.)

If the install fails, the wizard shows the last lines of its log. The full log is
`<install folder>\logs\installer.log` (or `%TEMP%\EvE-Conduit-installer.log` if the folder was never
created). Fix the cause and run the setup again. If the folder was created, remove it first or choose
another: the installer wants an empty folder.

### If you skipped the EVE application in the wizard

Open `<install folder>\config\conduit.env` in Notepad (as administrator), fill in `ESI_CLIENT_ID=` and
`ESI_SECRET_KEY=`, save, then run `conduit restart` in an Administrator terminal. The callback URL to
register is in the same file.

## 4. First login and the setup wizard

1. Open `https://auth.example.com` in a browser. You should see the EvE Conduit sign-in page with a
   valid certificate (a padlock). Caddy asks Let's Encrypt for the certificate when it starts; that takes a
   few seconds once DNS and the port forwarding are right. If the browser warns about the certificate, see
   [Troubleshooting](#troubleshooting).
2. Click **Log in with EVE Online** and sign in with your **main character**. EVE asks you to approve the
   scopes once.
3. The setup wizard opens. At **Prove you run this server**, paste the setup code and click **Claim admin**.
   (The wizard shows a `docker compose` command for finding the code; on this install the command is
   `conduit setup-code`.) Your account is now the administrator.
4. The wizard then asks for the site's name and branding, and which plugins to switch on. Everything can be
   changed later under **Administration**.

You are done. Members can now sign in at your domain. They start in the **Guest** state until you set up
states and groups under **Administration → States** and **Administration → Groups**. On the first start the
worker imports EVE's static data (items, systems, skills), which takes about a minute; **Administration →
Health** shows when it is in.

## Keep the PC running

A Windows PC is not a server by default:

- **Settings → System → Power:** set *Sleep* to **Never** when plugged in.
- **Windows Update → Advanced options:** set **active hours** so automatic restarts happen at night.
  The services start again by themselves after a reboot.
- Nobody needs to be signed in: the services run in the background. The tray control panel only shows
  while someone is signed in.

## Day to day

Open a terminal **as Administrator** (right-click **Terminal** or **PowerShell** → **Run as administrator**).
The installer put the `conduit` command on the PATH.

| Task | Command |
|---|---|
| Status of every service and its port | `conduit status` |
| Restart after editing `conduit.env` | `conduit restart` (or `conduit restart web`) |
| Follow a log | `conduit logs web` (or `worker`, `beat`, `caddy`, `garnet`, `postgres` or `mariadb`) |
| Run a management command | `conduit manage <command>` |
| Print the setup code again (until setup is done) | `conduit setup-code` |
| Back up the database and config | `conduit backup` (writes to `<install folder>\backups`) |
| Install a plugin from the server | `conduit plugin install <package>` |
| List installed plugins | `conduit plugin list` |
| Upgrade to a new release by hand | `conduit upgrade eve-conduit-X.Y.Z-windows.zip` |
| Go back to the previous release | `conduit rollback` |
| Open the tray control panel | `conduit tray` (`conduit tray on` or `off` starts it at sign-in or not) |
| Remove EvE Conduit | `conduit uninstall` |

The services also appear in **services.msc** as "EvE Conduit ...".

### The tray control panel

A hexagon icon by the clock shows the site's health: **green** when every service runs and answers on
its port, **amber** when a background service is stopped or still starting, **red** when the database,
cache, application or web server is down, **grey** while checking. It checks every 30 seconds and shows a
notification when the health changes. Hover for a summary; double-click for the status window with
*Restart selected*, *Restart all*, *Open site* and *Show log*; right-click to open the site, restart,
start or stop all services, back up now or close the panel. Anything that changes the services asks for
administrator rights.

## Installing plugins

Plugins add pages and features (recruitment, SRP, fleets, Discord, timers and so on). Two ways:

- **From the website:** **Administration → Plugins → Browse** lists the official plugins. Tick the ones you
  want and install them. The install's updater (the same one that installs EvE Conduit updates) does the
  work within seconds, takes a backup first and puts things back if anything fails. Plugins from other git
  repositories can be installed there too once you set `CONDUIT_PLUGIN_URLS=true` in `conduit.env`
  (git must be installed on the machine).
- **From the machine:** `conduit plugin install <package>` in an Administrator terminal, where the package
  is a PyPI name, a git URL or a path.

Either way, the new plugin appears switched off under **Administration → Plugins**. Switch it on there.

## Backups

`conduit backup` (Administrator terminal, or **Back up now** in the tray panel) writes a zip to
`<install folder>\backups` containing a database dump, `conduit.env` (it holds the keys that decrypt
members' stored EVE logins; without it a database backup is useless) and the plugin lists. The folder is
readable by Administrators only. Copy backups somewhere off the machine. To run one every
night, create a scheduled task in an Administrator PowerShell:

```powershell
$action  = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\EvE-Conduit\conduit.ps1 backup"
$trigger = New-ScheduledTaskTrigger -Daily -At 3:15am
Register-ScheduledTask -TaskName "EvE Conduit backup" -Action $action -Trigger $trigger -User "SYSTEM" -RunLevel Highest
```

Adjust the path if you installed somewhere else.

## Updating

New versions are published as [GitHub releases](https://github.com/EvE-Conduit/Eve-conduit/releases);
what changed is in [CHANGELOG.md](../CHANGELOG.md). Your install checks once a day and tells
administrators under **Administration → Updates**, which shows the changelog and asks before downloading
and again before installing. Nothing happens until an administrator clicks **Install**.

When they do, the updater (a scheduled task running as SYSTEM) starts within seconds, checks the release's
signature, backs up, stops the application, installs the new release next to the old one, runs the
database migrations, publishes the new front end and starts everything again. If installing fails, it puts
the running release back. The site is down for a few minutes.

Two ways to do it by hand:

- Run the newer `EvE-Conduit-Setup-X.Y.Z.exe`. It finds the existing install and offers to upgrade it.
- Or download `eve-conduit-X.Y.Z-windows.zip` and, in an Administrator terminal:
  ```powershell
  Unblock-File .\eve-conduit-X.Y.Z-windows.zip
  conduit upgrade .\eve-conduit-X.Y.Z-windows.zip
  ```

If an upgrade stops half-way after switching releases (for example because a service was down), fix the
cause and run `conduit repair` to redo the remaining steps. `conduit rollback` returns to the previous
release; database migrations are not undone, so restore the backup if the old version will not start.

## Uninstalling

Use **Settings → Apps → Installed apps → EvE Conduit → Uninstall**, or `conduit uninstall` in an
Administrator terminal. It asks what to remove:

1. **Everything, including the database.** It first offers to save a final backup to a folder you choose
   outside the install folder, then asks you to type `DELETE`.
2. **The programs only.** It keeps `config` (settings and passwords), `data` (the database files) and
   `backups` in the install folder.

It then closes the tray panel, stops and removes the services, removes the firewall rule, the PATH entry,
the sign-in entry and the Apps & features entry, and deletes the files. For scripts:
`conduit uninstall -Mode All -BackupTo D:\Backups -Yes` (or `-Mode KeepData`, `-NoBackup`).

## Using an IP address instead of a domain

If you have no domain, enter your **public, fixed IPv4 address** (for example `203.0.113.7`) on the
wizard's **Your site** page. The site is then `https://203.0.113.7` and the EVE callback URL
`https://203.0.113.7/sso/callback`. Caddy gets a Let's Encrypt certificate for the IP address; those are
valid for six days and renewed automatically.

Two conditions: the address must never change (ask your provider for a static IP; the EVE login and the
certificate are tied to it), and port 80 or 443 must be reachable from the internet. Private addresses
(`192.168.x.x`, `10.x.x.x`, `172.16.x.x` to `172.31.x.x`) and connections behind carrier-grade NAT cannot
get a certificate; for a site that is only on your local network, choose **Plain HTTP only** on the
**Connection** page.

## Installing from PowerShell instead of the wizard

The setup runs `windows\install.ps1` underneath; you can run it yourself, for example on Server Core or to
script an install.

1. Download `eve-conduit-X.Y.Z-windows.zip` from the releases page. In PowerShell, **unblock it before
   extracting** so Windows does not block the scripts inside:
   ```powershell
   Unblock-File $HOME\Downloads\eve-conduit-X.Y.Z-windows.zip
   Expand-Archive $HOME\Downloads\eve-conduit-X.Y.Z-windows.zip -DestinationPath $HOME\Downloads
   ```
2. In **PowerShell as Administrator**:
   ```powershell
   cd $HOME\Downloads\eve-conduit-X.Y.Z-windows
   Set-ExecutionPolicy -Scope Process Bypass
   .\windows\install.ps1 -Domain auth.example.com -Email you@example.com
   ```
3. It asks for the install folder and the ports (press Enter to accept each suggestion), shows a summary,
   asks you to confirm, and prints the **setup code** at the end.

Options: `-Database MariaDB`; `-DatabaseUrl postgres://...` to use an existing database server instead
of installing one; `-NoTls` for plain HTTP; `-EsiClientId` and `-EsiSecret`; `-InstallRoot`, `-HttpPort`,
`-HttpsPort`, `-AppPort`, `-CachePort`, `-DatabasePort` and `-PublicPorts Standard|AsChosen` to answer the
questions in advance; `-NoTray`; and `-Yes` to ask nothing (requires `-InstallRoot`).

The wizard itself can also run silently; see [windows/installer/README.md](../windows/installer/README.md#silent-installs).

## Troubleshooting

| Problem | What to check |
|---|---|
| Browser warns about the certificate, or HTTPS does not work | Caddy could not get a certificate. `conduit logs caddy` says why. Usually DNS does not point at your public IP yet, or port 80 is not forwarded to this PC (Let's Encrypt must reach it). Fix the cause; Caddy retries by itself. |
| The site works on this PC but not from outside | Router port forwarding for 80 and 443 to this PC's local address, and the Windows Firewall rule "EvE Conduit web" that the installer created (`Get-NetFirewallRule -DisplayName "EvE Conduit web"`). |
| EVE login fails with `invalid_scope` | A scope is missing on the EVE application. Edit it at developers.eveonline.com and select every scope. |
| EVE login fails with a redirect or callback error | The callback URL on the EVE application must be exactly `https://<your domain>/sso/callback` and match `CONDUIT_SITE_URL` in `conduit.env`. |
| `Bad Request (400)` after signing in | `CONDUIT_ALLOWED_HOSTS` in `conduit.env` does not contain the domain in the address bar. Fix it and `conduit restart`. |
| Tray icon is red | `conduit status` shows which service is down; `conduit logs <name>` shows why. PostgreSQL or Garnet refusing to start with a missing `msvcp140.dll` or `vcruntime140.dll` means the Visual C++ runtime DLLs were not copied; see the manual install notes in [windows/README.md](../windows/README.md#manual-install). |
| The installer refused a port | Another program is listening on it, or it is in a range Windows reserves for Hyper-V, WSL or Docker. Pick another port on the Ports page; `conduit ports` shows what an install uses. |
| Updates approved on the website never install | The updater scheduled task is missing; `conduit apply-update` in an Administrator terminal installs a pending update by hand and shows errors. |
| Changing ports after the install | Not automated yet. Edit `config\conduit.env` (`CONDUIT_BIND`, `REDIS_URL`, `DATABASE_URL`), `config\Caddyfile` and the port in `services\conduit-garnet.xml`, re-register that service (`services\conduit-garnet.exe uninstall`, then `install`) and `conduit restart`. For the database port also change `port` in `data\postgres\postgresql.conf` (or `data\mariadb\my.ini`). |
