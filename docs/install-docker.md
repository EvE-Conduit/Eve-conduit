# Installing EvE Conduit with Docker

This guide installs EvE Conduit on a Linux server using Docker. Everything (the application, the
database, the cache, the background workers and the web server with HTTPS) runs in containers, so the
install is the same on every Linux distribution. It is the recommended way to run EvE Conduit if you are
unsure which guide to follow.

The same containers run on a Windows PC with Docker Desktop; see [Windows with Docker Desktop](#windows-with-docker-desktop)
at the end. For an install without Docker, see the [Linux guide](install-linux.md) or the
[Windows guide](install-windows.md).

**How long it takes:** about 30 minutes, most of it waiting for the first build.

## What you get

| Container | What it does |
|---|---|
| `web` | EvE Conduit itself (Django, served by gunicorn) |
| `worker` | background jobs: syncing characters from EVE, webhooks, imports |
| `beat` | the scheduler that queues those jobs |
| `caddy` | the web server: serves the site, forwards API calls to `web`, gets and renews the HTTPS certificate |
| `db` | PostgreSQL 17, the database |
| `redis` | Redis 7, the cache and job queue |

The database, Redis data and HTTPS certificates live in Docker volumes (`db_data`, `redis_data`, `caddy_data`),
so they survive rebuilds and updates.

## What you need

- **A Linux server** with 2 CPU cores, 4 GB RAM and 20 GB of disk. A small cloud VPS is enough for a
  corporation; see [Sizing](#sizing-for-larger-installs) for alliances. Any distribution that runs Docker
  works (Ubuntu 22.04 or 24.04 and Debian 12 are the most common).
- **Root access** (or a user that can run `sudo`).
- **Ports 80 and 443 open** to the internet. On a cloud server, check the provider's firewall or
  "security group" as well as the server's own firewall.
- **A domain name** (for example `auth.example.com`) with a DNS **A record** pointing at the server's
  public IP address. Subdomains of a domain you already own work fine. Never set up DNS before? Read
  [Pointing a domain at your server](dns.md) first.
  **No domain?** You can use the server's public IPv4 address instead; see [Using an IP address instead of a domain](#using-an-ip-address-instead-of-a-domain).
- **An EVE Online account** to sign in with. The first person to sign in and enter the setup code
  becomes the administrator.

## 1. Install Docker

Docker's own instructions cover every distribution: <https://docs.docker.com/engine/install/>.
On Ubuntu or Debian, the quickest way is Docker's install script:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # lets your user run docker without sudo; log out and in again
```

Check that Docker and the Compose plugin work:

```bash
docker version
docker compose version
```

Both should print version numbers. `docker compose` (with a space) is the Compose plugin that EvE Conduit
uses; the old separate `docker-compose` program is not needed.

You also need `git` and `openssl`, which most servers already have (`sudo apt-get install -y git openssl`
on Ubuntu/Debian).

## 2. Point your domain at the server

In your DNS provider's control panel, create an **A record** for your chosen name (for example
`auth.example.com`) with the server's public IPv4 address. [dns.md](dns.md) walks through it, including
what to do on a home connection. DNS changes can take a few minutes to spread. Check from the server:

```bash
getent hosts auth.example.com
```

It should print the server's public IP. The HTTPS certificate cannot be issued until this is right.

## 3. Get EvE Conduit

Docker builds EvE Conduit from its source code, so you need a copy of the repository (not the
`eve-conduit-X.Y.Z.tar.gz` download from the releases page, which is for the Linux install without
Docker and does not contain the Docker files).

```bash
sudo mkdir -p /opt/eve-conduit && sudo chown $USER /opt/eve-conduit
git clone https://github.com/EvE-Conduit/Eve-conduit.git /opt/eve-conduit
cd /opt/eve-conduit
```

Any folder works; `/opt/eve-conduit` is used in the rest of this guide. Keep the folder: you will run
every later command from it, and updates are a `git pull` in it.

## 4. Register an EVE application

EvE Conduit signs people in through EVE's official login (SSO). Each site registers its own application
with CCP:

1. Go to <https://developers.eveonline.com/applications> and sign in with your EVE account.
2. Click **Create new application**.
3. Name and description: anything, for example your corporation's name. Members see the name when they
   sign in.
4. Connection type: **Authentication & API Access**.
5. **Permissions (scopes): select every scope.** EvE Conduit asks members for all of them at sign-in so
   that no feature has to ask again later. A scope that is missing here makes the EVE login fail with
   `invalid_scope`.
6. **Callback URL:** exactly `https://auth.example.com/sso/callback`, with your own domain. No trailing
   slash.
7. Create the application, then open it and keep the **Client ID** and **Secret Key** for the next step.

## 5. Configure

Copy the example settings file and open it in an editor:

```bash
cp .env.example .env
nano .env
```

Fill in everything under **Required**. These are the values and where they come from:

| Setting | What to put there |
|---|---|
| `CONDUIT_SECRET_KEY` | A long random string that signs sessions. Generate one with the command below. |
| `POSTGRES_PASSWORD` | The database password. Another random string (letters and digits only, to be safe in a URL). |
| `CONDUIT_DOMAIN` | Your domain, for example `auth.example.com`. Caddy gets the HTTPS certificate for it. |
| `CONDUIT_SITE_URL` | `https://auth.example.com` (your domain with `https://`, no trailing slash) |
| `CONDUIT_ALLOWED_HOSTS` | `auth.example.com` (your domain again) |
| `ESI_CLIENT_ID` | The Client ID from step 4 |
| `ESI_SECRET_KEY` | The Secret Key from step 4 |
| `ESI_USER_AGENT_CONTACT` | Your email address. CCP asks every application that talks to ESI to identify its operator. |
| `CONDUIT_TOKEN_KEY` | The key that encrypts members' stored EVE logins. Generate one with the command below. |

Generate the three random values:

```bash
echo "CONDUIT_SECRET_KEY=$(head -c 64 /dev/urandom | base64 | tr -dc A-Za-z0-9 | head -c 60)"
echo "POSTGRES_PASSWORD=$(head -c 32 /dev/urandom | base64 | tr -dc A-Za-z0-9 | head -c 32)"
echo "CONDUIT_TOKEN_KEY=$(openssl rand -base64 32 | tr '+/' '-_')"
```

Paste each printed line over the matching line in `.env`. Do not change `POSTGRES_PASSWORD` after the first
start: the database is created with it. (`CONDUIT_TOKEN_KEY` can be changed later; see
[security.md](security.md#setting-or-changing-the-token-key).)

The settings under **Optional** can stay commented out. Save the file. `.env` holds secrets, so keep it
readable by you only:

```bash
chmod 600 .env
```

## 6. Start it

```bash
docker compose up -d --build
```

The first run builds two images (the front end needs Node.js, the backend Python; both are downloaded
inside the build) and pulls PostgreSQL, Redis and Caddy. Expect 5 to 10 minutes. When it returns, check
that all six containers are running:

```bash
docker compose ps
```

Every row should say `Up` (the `db` row says `Up (healthy)`). If one says `Exited` or keeps restarting,
read its log: `docker compose logs web` (or `caddy`, `worker`, and so on).

On the first start, `web` creates the database tables, and `worker` imports EVE's static data (items,
systems, skills), which takes about a minute. Caddy asks Let's Encrypt for the certificate as soon as it
starts; that takes a few seconds once DNS is right.

## 7. Get the setup code

To stop anyone else from claiming your fresh install, the first administrator has to prove they run the
server by entering a one-time code that is printed in the server log:

```bash
docker compose logs web | grep "setup code"
```

It prints a line like `EvE Conduit first-run setup code: ab12cd34...`. Copy the code.

If the line is missing (for example because the log was cleared), print it again:

```bash
docker compose exec web python manage.py conduit_init
```

The code stays valid until the setup is completed.

## 8. First login and the setup wizard

1. Open `https://auth.example.com` in a browser. You should see the EvE Conduit sign-in page with a
   valid certificate (a padlock). If the browser warns about the certificate, see
   [Troubleshooting](#troubleshooting).
2. Click **Log in with EVE Online** and sign in with your **main character**. EVE asks you to approve the
   scopes once.
3. The setup wizard opens. At **Prove you run this server**, paste the setup code and click **Claim admin**.
   Your account is now the administrator.
4. The wizard then asks for the site's name and branding, and which plugins to switch on. Everything can be
   changed later under **Administration**.

You are done. Members can now sign in at your domain. They start in the **Guest** state until you set up
states and groups under **Administration → States** and **Administration → Groups**.

## Day to day

Run these in the EvE Conduit folder (`cd /opt/eve-conduit`):

| Task | Command |
|---|---|
| Status of every container | `docker compose ps` |
| Follow the application log | `docker compose logs -f web` (or `worker`, `beat`, `caddy`, `db`) |
| Apply a change to `.env` | `docker compose up -d` |
| Restart everything | `docker compose restart` |
| Stop everything (data is kept) | `docker compose down` |
| Start again | `docker compose up -d` |
| Run a management command | `docker compose exec web python manage.py <command>` |
| Print the setup code again (until setup is done) | `docker compose exec web python manage.py conduit_init` |
| Check the site's health | **Administration → Health** in the browser |

The containers start automatically after a reboot (`restart: unless-stopped`), unless you stopped them
with `docker compose down`.

## Installing plugins

Plugins add pages and features (recruitment, SRP, fleets, Discord, timers and so on). On a Docker install
they are built into the image, so adding one means a rebuild:

1. In the browser, open **Administration → Plugins → Browse**. It lists the official plugins and shows,
   for each one, the line to add to `requirements-plugins.txt`.
2. Add that line to `requirements-plugins.txt` in the EvE Conduit folder (one plugin per line; the file
   explains the format). PyPI package names, git URLs and local paths all work.
3. Rebuild and restart:
   ```bash
   docker compose up -d --build
   ```
4. The new plugin appears switched off under **Administration → Plugins**. Switch it on there.

To remove a plugin, switch it off in Administration, delete its line and rebuild.

## Backups

Back up two things: the database and your `.env` file (it holds the keys that decrypt members' stored
EVE logins; without it a database backup is useless). Run this from the EvE Conduit folder, for example
from a nightly cron job:

```bash
mkdir -p /var/backups/eve-conduit
docker compose exec db pg_dump -U conduit -Fc conduit > /var/backups/eve-conduit/db-$(date +%F).dump
cp .env /var/backups/eve-conduit/env-$(date +%F)
chmod 600 /var/backups/eve-conduit/*
```

Copy the backup folder somewhere off the server. Caddy's certificates do not need backing up; they are
re-issued automatically.

**Restoring** on a fresh install (same `.env`, containers built and started once):

```bash
docker compose stop web worker beat
docker compose exec db dropdb -U conduit conduit
docker compose exec db createdb -U conduit conduit
docker compose exec -T db pg_restore -U conduit -d conduit < /var/backups/eve-conduit/db-2026-10-11.dump
docker compose up -d
```

## Updating

New versions are published as [GitHub releases](https://github.com/EvE-Conduit/Eve-conduit/releases);
what changed is in [CHANGELOG.md](../CHANGELOG.md). Your install checks once a day and tells
administrators under **Administration → Updates**, which shows the changelog. A Docker install does not
update itself; run, in the EvE Conduit folder:

```bash
git pull
docker compose up -d --build
```

This rebuilds the images with the new code and restarts the containers. Database migrations run
automatically when `web` starts. The site is down for the minute or two the restart takes. Take a
[backup](#backups) first if you want to be able to go back.

## Sizing for larger installs

The defaults in `.env.example` suit up to a few hundred members on a 4 GB server. For a large alliance
(about 4000 members, 8 cores, 16 to 32 GB RAM), uncomment and set in `.env`:

- `WORKER_CONCURRENCY=100`: background jobs running at once. About 16 per 1000 characters. Past 100,
  run a second worker instead: `docker compose up -d --scale worker=2`.
- `POSTGRES_SHARED_BUFFERS`: a quarter of RAM, for example `4GB`.
- `POSTGRES_EFFECTIVE_CACHE_SIZE`: half to three quarters of RAM, for example `12GB`.
- `POSTGRES_MAX_CONNECTIONS`: more than every worker's `WORKER_CONCURRENCY + 4` added up, plus a few for
  `web` and `beat`.

Apply database settings with `docker compose up -d db`, the rest with `docker compose up -d`.

## Using an IP address instead of a domain

If you have no domain, use the server's **public, fixed IPv4 address** everywhere this guide says domain:

```ini
CONDUIT_DOMAIN=203.0.113.7
CONDUIT_SITE_URL=https://203.0.113.7
CONDUIT_ALLOWED_HOSTS=203.0.113.7
```

and register the EVE callback URL as `https://203.0.113.7/sso/callback`. Caddy then gets a Let's Encrypt
certificate for the IP address. Those certificates are valid for six days and renewed automatically.

Two conditions: the address must never change (ask your provider for a static IP; the EVE login and the
certificate are tied to it), and port 80 or 443 must be reachable from the internet. Private addresses
(`192.168.x.x`, `10.x.x.x`, `172.16.x.x` to `172.31.x.x`) and connections behind carrier-grade NAT cannot
get a certificate.

**Only on your local network, no HTTPS at all:** leave `CONDUIT_DOMAIN` empty. Caddy then serves plain
HTTP on port 80. Set `CONDUIT_SITE_URL=http://192.168.1.10` and `CONDUIT_ALLOWED_HOSTS=192.168.1.10`
(the server's LAN address) and register the callback as `http://192.168.1.10/sso/callback`. Use this
for testing only: without HTTPS, sessions are only as safe as the network.

## Windows with Docker Desktop

Docker Desktop runs the same Linux containers on Windows 10 or 11, using WSL 2 (Windows' built-in Linux
layer). Nothing in EvE Conduit changes, so the steps above apply, with these differences.

**What you need:** Windows 11, or Windows 10 22H2, 64-bit; hardware virtualisation switched on in the
BIOS/UEFI (called Intel VT-x, AMD-V or SVM); 8 GB RAM or more and 20 GB free disk; a domain pointing at
your public IP and TCP ports 80 and 443 forwarded from your router to this PC. Docker Desktop is free
for personal use and small organisations; larger ones should check [Docker's terms](https://www.docker.com/pricing/).

**Not for Windows Server:** Docker Desktop is a Windows 10/11 product, and Windows Server's own Docker
engine runs Windows containers, not Linux ones. On Windows Server use the [native Windows install](install-windows.md).

1. **Install WSL 2 and Docker Desktop.** In **PowerShell as Administrator**, run `wsl --install` and
   restart when asked. Then install [Docker Desktop](https://www.docker.com/products/docker-desktop/),
   keeping **Use WSL 2 instead of Hyper-V** ticked. Start it, wait for **Engine running**, and in
   **Settings → General** tick **Start Docker Desktop when you sign in**. Check with `docker compose version`
   in PowerShell.
2. **Get EvE Conduit** with [Git for Windows](https://git-scm.com/download/win):
   ```powershell
   git clone https://github.com/EvE-Conduit/Eve-conduit.git C:\EvE-Conduit
   cd C:\EvE-Conduit
   ```
   Or download the repository as a ZIP from GitHub (**Code → Download ZIP**), unpack it to `C:\EvE-Conduit`
   and `cd` there.
3. **Register the EVE application** as in [step 4](#4-register-an-eve-application).
4. **Configure:** `copy .env.example .env`, then `notepad .env` and fill in the Required values as in
   [step 5](#5-configure). Generate the random values in PowerShell:
   ```powershell
   $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
   $b = New-Object byte[] 48; $rng.GetBytes($b); "CONDUIT_SECRET_KEY=" + ([Convert]::ToBase64String($b) -replace '[^A-Za-z0-9]', '')
   $b = New-Object byte[] 24; $rng.GetBytes($b); "POSTGRES_PASSWORD=" + ([Convert]::ToBase64String($b) -replace '[^A-Za-z0-9]', '')
   $b = New-Object byte[] 32; $rng.GetBytes($b); "CONDUIT_TOKEN_KEY=" + [Convert]::ToBase64String($b).Replace('+', '-').Replace('/', '_')
   ```
5. **Start it:** `docker compose up -d --build`, then `docker compose logs web | Select-String "setup code"`
   for the setup code, and sign in as in [step 8](#8-first-login-and-the-setup-wizard).
6. **Let the internet reach it.** Forward TCP ports 80 and 443 on your router to this PC's local IP
   address. Docker Desktop normally adds the Windows Firewall rules itself; if the site is not reachable
   from outside, add one in an Administrator PowerShell:
   ```powershell
   New-NetFirewallRule -DisplayName "EvE Conduit HTTP/HTTPS" -Direction Inbound -Protocol TCP -LocalPort 80,443 -Action Allow
   ```
7. **Keep it running.** A Windows PC is not a server by default. In **Settings → System → Power** set
   *Sleep* to **Never** when plugged in. Under **Windows Update → Advanced options** set active hours so
   restarts happen at night. Docker Desktop only runs while a user is signed in, so lock the screen rather
   than signing out, or turn on automatic sign-in for that account. After a reboot the containers come
   back once Docker Desktop has started.

Day to day, backups and updates are the same commands as on Linux, run in PowerShell in `C:\EvE-Conduit`.
For the backup, redirect `pg_dump` to a file the same way; for the date, use `$(Get-Date -Format yyyy-MM-dd)`.

## Troubleshooting

| Problem | What to check |
|---|---|
| Browser says the connection is not private, or the site does not load over HTTPS | Caddy could not get a certificate. `docker compose logs caddy` says why. Usually DNS does not point at this server yet, or port 80 is blocked (Let's Encrypt must reach it). Fix the cause; Caddy retries by itself. |
| The site loads but EVE login fails with `invalid_scope` | A scope is missing on the EVE application. Edit the application at developers.eveonline.com and select every scope. |
| EVE login fails with a redirect or callback error | The callback URL on the EVE application must be exactly `https://<your domain>/sso/callback` and match `CONDUIT_SITE_URL`. |
| `Bad Request (400)` after signing in | `CONDUIT_ALLOWED_HOSTS` does not contain the domain in the address bar. Fix it and run `docker compose up -d`. |
| `grep "setup code"` prints nothing | Run `docker compose exec web python manage.py conduit_init`. If it prints nothing either, setup is already complete. |
| `web` keeps restarting | `docker compose logs web`. A wrong `POSTGRES_PASSWORD` after the first start is the usual cause (the database was created with the old one). |
| The site is slow or syncs lag behind | **Administration → Health** shows the queue, workers and ESI error budget. See [Sizing](#sizing-for-larger-installs). |
| Not reachable from the internet at all | The server's firewall (`sudo ufw status`), the cloud provider's firewall or security group, and the router's port forwarding on a home connection. |
