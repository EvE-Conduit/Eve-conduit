# Installing EvE Conduit on Linux (without Docker)

This guide installs EvE Conduit directly on a Linux server, the way Alliance Auth and SeAT document
their manual installs: PostgreSQL or MariaDB, Redis, Supervisor and nginx as normal system packages,
EvE Conduit in a Python virtualenv. Prefer containers? See the [Docker guide](install-docker.md).

An install script does every step for you. Read [Quick install](#quick-install-with-the-script) first;
the [manual install](#manual-install) further down is the same work by hand, for people who want to see
exactly what happens or need to deviate from it.

**How long it takes:** 15 minutes with the script, about an hour by hand.

## What you get

| Piece | What is used |
|---|---|
| Application | Python 3.12 in a virtualenv at `/opt/conduit/venv`, served by gunicorn on `127.0.0.1:8000` |
| Database | PostgreSQL (recommended) or MariaDB |
| Cache and job queue | Redis (Valkey on RHEL 10, which is the same protocol) |
| Background jobs | a Celery worker and Celery beat (the scheduler) |
| Process manager | Supervisor, which starts the three services and restarts them if they crash |
| Web server and HTTPS | nginx, with a free Let's Encrypt certificate from certbot |
| Admin command | `conduit` in `/usr/local/bin` (status, logs, backup, upgrade, plugins) |
| Updates | approved on the website, installed by a root systemd unit (cron as backup) |

Where things live:

| Path | Contents |
|---|---|
| `/opt/conduit/releases/<version>` | unpacked releases; `/opt/conduit/app` is a symlink to the one running |
| `/opt/conduit/venv` | the Python virtualenv (owned by root, so the service cannot change its own code) |
| `/etc/conduit/conduit.env` | configuration and secrets |
| `/etc/conduit/plugins.txt` | plugins installed from the server |
| `/var/www/conduit/web`, `/var/www/conduit/static` | the front end and static files, served by nginx |
| `/var/log/conduit` | `web.log`, `worker.log`, `beat.log` |
| `/var/lib/conduit` | scheduler state and downloaded updates |
| `/var/backups/conduit` | backups made by `conduit backup` |

## What you need

- **A supported distribution:** Ubuntu 22.04 or 24.04, Debian 12 or 13, or Rocky Linux, AlmaLinux,
  RHEL or CentOS Stream 9 or 10. A fresh server is best; the script installs packages and takes over
  nginx's default site.
- **A server** with 2 CPU cores, 4 GB RAM and 20 GB of disk; see [Sizing](#sizing-for-larger-installs)
  for alliances.
- **Root access**: all commands run as root. Start with `sudo -i`, or put `sudo` in front of each.
- **Ports 80 and 443 open** to the internet. On a cloud server, check the provider's firewall or
  "security group" as well as the server's own.
- **A domain name** (for example `auth.example.com`) with a DNS **A record** pointing at the server's
  public IP address; [dns.md](dns.md) explains how to set one up. **No domain?** See [Using an IP address instead of a domain](#using-an-ip-address-instead-of-a-domain).
- **An EVE Online account** to sign in with. The first person to sign in and enter the setup code
  becomes the administrator.

## Quick install with the script

### 1. Point your domain at the server

In your DNS provider's control panel, create an **A record** for your chosen name with the server's public
IPv4 address ([dns.md](dns.md) walks through it). Check from the server with `getent hosts auth.example.com`; it should print the server's
public IP. The HTTPS certificate cannot be issued until this is right.

### 2. Download and unpack the release

Every release on <https://github.com/EvE-Conduit/Eve-conduit/releases> has a file named
`eve-conduit-X.Y.Z.tar.gz` (the Linux release, with the front end prebuilt so the server never needs
Node.js). Download the newest one and unpack it:

```bash
cd ~
curl -LO https://github.com/EvE-Conduit/Eve-conduit/releases/download/vX.Y.Z/eve-conduit-X.Y.Z.tar.gz
tar -xzf eve-conduit-X.Y.Z.tar.gz
cd eve-conduit-X.Y.Z
```

Replace `X.Y.Z` with the version, for example `0.5.40`.

### 3. Run the installer

```bash
sudo ./deploy/baremetal/install.sh --domain auth.example.com --email you@example.com
```

Use your own domain and email. The email goes to Let's Encrypt (certificate expiry warnings) and into
the User-Agent EvE Conduit sends to CCP, which asks every ESI application to identify its operator.

Options:

| Option | Meaning |
|---|---|
| `--db mariadb` | use MariaDB instead of PostgreSQL |
| `--esi-client-id ID --esi-secret KEY` | put the EVE application details in now (otherwise you add them in step 4) |
| `--no-tls` | plain HTTP, no certificate (for a test on a local network, or behind another proxy that does HTTPS) |
| `--yes` | don't ask for confirmation |

The script shows what it is about to do and asks you to confirm. It then installs the packages, creates
the `conduit` system user, sets up Python 3.12, creates the database with a random password, writes
`/etc/conduit/conduit.env` with fresh secrets, installs EvE Conduit, starts the services under
Supervisor, configures nginx and asks Let's Encrypt for the certificate. It takes 5 to 15 minutes.

At the end it prints the one-time **setup code** and the next steps. Keep the code (you can print it again
with `sudo conduit setup-code` until setup is complete).

If certbot fails at the end (DNS not ready, port 80 blocked), everything else is installed. Fix the cause
and run `sudo certbot --nginx -d auth.example.com` yourself.

### 4. Register an EVE application

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
   slash. (With `--no-tls`, it starts with `http://`.)
7. Create the application, then open it and copy the **Client ID** and **Secret Key**.

Put them into the configuration and restart:

```bash
sudo nano /etc/conduit/conduit.env      # fill in ESI_CLIENT_ID= and ESI_SECRET_KEY=
sudo conduit restart
```

Skip the edit if you passed `--esi-client-id` and `--esi-secret` to the installer.

### 5. First login and the setup wizard

1. Open `https://auth.example.com` in a browser. You should see the EvE Conduit sign-in page with a
   valid certificate (a padlock).
2. Click **Log in with EVE Online** and sign in with your **main character**. EVE asks you to approve the
   scopes once.
3. The setup wizard opens. At **Prove you run this server**, paste the setup code and click **Claim admin**.
   (The wizard shows a `docker compose` command for finding the code; on this install the command is
   `sudo conduit setup-code`.) Your account is now the administrator.
4. The wizard then asks for the site's name and branding, and which plugins to switch on. Everything can be
   changed later under **Administration**.

You are done. Members can now sign in at your domain. They start in the **Guest** state until you set up
states and groups under **Administration → States** and **Administration → Groups**. On the first start the worker imports EVE's static
data (items, systems, skills), which takes about a minute; **Administration → Health** shows when it is
in.

## Day to day

All of these need root (`sudo`):

| Task | Command |
|---|---|
| Service status | `conduit status` (expect `conduit:web`, `conduit:worker` and `conduit:beat` as `RUNNING`) |
| Restart after editing the config | `conduit restart` (or `conduit restart web`) |
| Follow a log | `conduit logs web` (or `worker`, `beat`) |
| Run a management command | `conduit manage <command>` |
| Print the setup code again (until setup is done) | `conduit setup-code` |
| Back up the database and config | `conduit backup` (writes `/var/backups/conduit/conduit-<date>.tar.gz`) |
| Install a plugin from the server | `conduit plugin install <package>` |
| List installed plugins | `conduit plugin list` |
| Upgrade to a new release by hand | `conduit upgrade eve-conduit-X.Y.Z.tar.gz` |
| Go back to the previous release | `conduit rollback` |
| Request or repair the IP address certificate | `conduit ip-cert` |

Supervisor's own tool works too: `supervisorctl status conduit:*`.

## Installing plugins

Plugins add pages and features (recruitment, SRP, fleets, Discord, timers and so on). Two ways:

- **From the website:** **Administration → Plugins → Browse** lists the official plugins. Tick the ones you
  want and install them. The install's updater (the same one that installs EvE Conduit updates) does the
  work within seconds, takes a backup first and puts things back if anything fails. Plugins from other git
  repositories can be installed there too once you set `CONDUIT_PLUGIN_URLS=true` in `conduit.env`
  (git must be installed on the server).
- **From the server:** `sudo conduit plugin install <package>`, where the package is a PyPI name, a git
  URL or a path. It is added to `/etc/conduit/plugins.txt` and installed into the virtualenv.

Either way, the new plugin appears switched off under **Administration → Plugins**. Switch it on there.

## Backups

`sudo conduit backup` writes a tarball to `/var/backups/conduit` containing a database dump
(`pg_dump` custom format, or a MariaDB SQL dump), `conduit.env`, the plugin lists and the name of the
running release. It contains secrets; copy it somewhere safe off the server and keep it readable by root
only. Run it from a nightly cron job:

```bash
echo '15 3 * * * root /usr/local/bin/conduit backup >/dev/null 2>&1' | sudo tee /etc/cron.d/conduit-backup
```

**Restoring** on a fresh install of the same version: unpack the tarball, copy `conduit.env` to
`/etc/conduit/` (it holds the keys that decrypt members' stored EVE logins; without it the database is
useless), stop the services (`sudo conduit stop`), restore the database (`pg_restore -U conduit -d conduit
--clean --if-exists database.dump` as the postgres user, or `mariadb conduit < database.sql`), then
`sudo conduit start`.

## Updating

New versions are published as [GitHub releases](https://github.com/EvE-Conduit/Eve-conduit/releases);
what changed is in [CHANGELOG.md](../CHANGELOG.md). Your install checks once a day and tells
administrators under **Administration → Updates**, which shows the changelog and asks before downloading
and again before installing. Nothing happens until an administrator clicks **Install**.

When they do, the updater (a root systemd path unit, with a cron job every two minutes as backup) starts
within seconds, checks the release's signature, backs up, installs the new release next to the old one,
runs the database migrations, publishes the new front end and restarts the services. If anything fails
before the switch, the running version is left untouched. The site is down for about a minute.

To do the same by hand, download the new `eve-conduit-X.Y.Z.tar.gz` and run:

```bash
sudo conduit upgrade eve-conduit-X.Y.Z.tar.gz
```

If the new version misbehaves, `sudo conduit rollback` switches back to the previous release. Database
migrations are not undone; if the old version will not start, restore the backup taken during the upgrade.

## Sizing for larger installs

The defaults suit up to a few hundred members on a 4 GB server. For a large alliance (about 4000 members,
8 cores, 16 to 32 GB RAM):

- In `/etc/conduit/conduit.env`, set `WORKER_CONCURRENCY=100` (background jobs running at once; about 16
  per 1000 characters), then `sudo conduit restart`.
- Raise PostgreSQL's stock settings (`/etc/postgresql/*/main/postgresql.conf` on Debian/Ubuntu,
  `/var/lib/pgsql/data/postgresql.conf` on RHEL), then `systemctl restart postgresql`:

```ini
max_connections = 200            # above WORKER_CONCURRENCY + 4, plus a few for web and beat
shared_buffers = 4GB             # a quarter of RAM
effective_cache_size = 12GB      # half to three quarters of RAM
work_mem = 16MB
maintenance_work_mem = 256MB
max_wal_size = 2GB
random_page_cost = 1.1           # SSD
autovacuum_naptime = 30s         # syncs rewrite the same tables all day: vacuum little and often
autovacuum_vacuum_scale_factor = 0.05
autovacuum_analyze_scale_factor = 0.02
autovacuum_vacuum_cost_limit = 1000
```

## Using an IP address instead of a domain

If you have no domain, pass the server's **public, fixed IPv4 address** instead:
`--domain 203.0.113.7`. The site is then `https://203.0.113.7` and the EVE callback URL
`https://203.0.113.7/sso/callback`.

Two conditions: the address must never change (ask your provider for a static IP; the EVE login and the
certificate are tied to it), and port 80 must be reachable from the internet. Private addresses
(`192.168.x.x`, `10.x.x.x`, `172.16.x.x` to `172.31.x.x`) and connections behind carrier-grade NAT cannot
get a certificate; the installer refuses them unless you add `--no-tls`.

Let's Encrypt issues IP address certificates that are valid for six days, and only certbot 5.4 or newer
can ask for them (the distributions' certbot is older). So for an IP address the installer runs
`conduit ip-cert` instead of the distribution's certbot. That installs a current certbot in
`/opt/conduit/certbot`, keeps its files in `/etc/conduit/letsencrypt`, adds HTTPS to the nginx site and
renews from `/etc/cron.d/conduit-certbot` every four hours. If the request failed, fix the cause (usually
port 80 not reachable from the internet) and run `sudo conduit ip-cert` again. Running it again is
always safe.

## Manual install

The same install by hand. Commands are for Ubuntu/Debian; RHEL-family differences are noted. Run
everything as root (`sudo -i`). Replace `auth.example.com` with your domain and `X.Y.Z` with the version
throughout.

### 1. Update the system

```bash
apt-get update && apt-get full-upgrade -y
```

RHEL family: `dnf upgrade -y && dnf install -y epel-release`

### 2. Install packages

```bash
apt-get install -y curl ca-certificates build-essential pkg-config python3 python3-venv \
    nginx redis-server supervisor certbot python3-certbot-nginx cron
# PostgreSQL (recommended):
apt-get install -y postgresql postgresql-client
# ...or MariaDB:
apt-get install -y mariadb-server mariadb-client libmariadb-dev

systemctl enable --now redis-server
```

RHEL family:

```bash
dnf install -y curl gcc make pkgconf python3 nginx supervisor certbot python3-certbot-nginx \
    policycoreutils-python-utils cronie redis   # RHEL 10: valkey instead of redis
dnf install -y postgresql-server postgresql     # or: mariadb-server mariadb mariadb-connector-c-devel
systemctl enable --now redis                    # RHEL 10: valkey
```

### 3. Create the service user and directories

```bash
useradd --system --home-dir /opt/conduit --shell /usr/sbin/nologin conduit
install -d -o root    -g conduit -m 0755 /opt/conduit /opt/conduit/releases
install -d -o root    -g conduit -m 0750 /etc/conduit
install -d -o conduit -g conduit -m 0755 /var/log/conduit /var/www/conduit/static
install -d -o conduit -g conduit -m 0750 /var/lib/conduit /var/lib/conduit/updates
install -d -o root    -g root    -m 0755 /var/www/conduit /var/www/conduit/web /var/www/conduit/acme
```

### 4. Unpack the release

Download `eve-conduit-X.Y.Z.tar.gz` from the [releases page](https://github.com/EvE-Conduit/Eve-conduit/releases), then:

```bash
tar -xzf eve-conduit-X.Y.Z.tar.gz -C /opt/conduit/releases
mv /opt/conduit/releases/eve-conduit-X.Y.Z /opt/conduit/releases/X.Y.Z
chown -R root:conduit /opt/conduit/releases/X.Y.Z
ln -sfn /opt/conduit/releases/X.Y.Z /opt/conduit/app
install -m 0755 /opt/conduit/app/deploy/baremetal/conduit /usr/local/bin/conduit
cp -a /opt/conduit/app/web/. /var/www/conduit/web/
```

### 5. Python 3.12 and the virtualenv

EvE Conduit needs Python 3.12 or newer. Ubuntu 22.04 and Debian 12 ship older versions, so
[uv](https://docs.astral.sh/uv/) is used to get the same Python everywhere without adding package
repositories:

```bash
python3 -m venv /opt/conduit/tools
/opt/conduit/tools/bin/pip install --upgrade pip uv
UV_PYTHON_INSTALL_DIR=/opt/conduit/python /opt/conduit/tools/bin/uv python install 3.12
UV_PYTHON_INSTALL_DIR=/opt/conduit/python /opt/conduit/tools/bin/uv venv --seed --python 3.12 /opt/conduit/venv
```

The virtualenv stays owned by root on purpose: the service can run the code but not change it.

### 6. Create the database

Choose a database password first (letters and digits, for example
`head -c 32 /dev/urandom | base64 | tr -dc A-Za-z0-9 | head -c 32`) and use it in place of
`CHOOSE-A-PASSWORD`.

**PostgreSQL:**

```bash
# RHEL family only: initialise, then allow password logins over TCP
postgresql-setup --initdb
sed -i -E 's/^(host\s+all\s+all\s+(127\.0\.0\.1\/32|::1\/128)\s+)ident/\1scram-sha-256/' /var/lib/pgsql/data/pg_hba.conf

systemctl enable --now postgresql
sudo -u postgres psql <<'SQL'
CREATE USER conduit WITH PASSWORD 'CHOOSE-A-PASSWORD';
CREATE DATABASE conduit OWNER conduit ENCODING 'UTF8';
SQL
```

**MariaDB:**

```bash
systemctl enable --now mariadb
mariadb -u root <<'SQL'
CREATE DATABASE conduit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'conduit'@'localhost' IDENTIFIED BY 'CHOOSE-A-PASSWORD';
CREATE USER 'conduit'@'127.0.0.1' IDENTIFIED BY 'CHOOSE-A-PASSWORD';
GRANT ALL PRIVILEGES ON conduit.* TO 'conduit'@'localhost';
GRANT ALL PRIVILEGES ON conduit.* TO 'conduit'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL
mariadb-secure-installation
```

### 7. Configure EvE Conduit

```bash
cp /opt/conduit/app/deploy/baremetal/conduit.env.example /etc/conduit/conduit.env
chown root:conduit /etc/conduit/conduit.env && chmod 0640 /etc/conduit/conduit.env
nano /etc/conduit/conduit.env
```

Set:

| Setting | What to put there |
|---|---|
| `CONDUIT_SECRET_KEY` | a long random string: `head -c 64 /dev/urandom \| base64 \| tr -dc A-Za-z0-9 \| head -c 60` |
| `CONDUIT_TOKEN_KEY` | the key that encrypts members' stored EVE logins: `openssl rand -base64 32 \| tr '+/' '-_'` |
| `CONDUIT_SITE_URL` | `https://auth.example.com` |
| `CONDUIT_ALLOWED_HOSTS` | `auth.example.com` |
| `DATABASE_URL` | `postgres://conduit:CHOOSE-A-PASSWORD@127.0.0.1:5432/conduit` or `mysql://conduit:CHOOSE-A-PASSWORD@127.0.0.1:3306/conduit` |
| `CONDUIT_INSTALL_KIND` | `baremetal` (tells the website this install can update itself) |
| `CONDUIT_UPDATES_DIR` | `/var/lib/conduit/updates` |
| `ESI_USER_AGENT_CONTACT` | your email address (CCP asks every ESI application to identify its operator) |
| `ESI_CLIENT_ID`, `ESI_SECRET_KEY` | from the EVE application; can wait until step 10 |

Then list the plugins that ship with the release so they get installed:

```bash
grep -v '^\s*#' /opt/conduit/app/requirements-plugins.txt | sed '/^\s*$/d' > /etc/conduit/plugins.txt
chown root:conduit /etc/conduit/plugins.txt
```

### 8. Install the application and prepare the database

```bash
cd /opt/conduit/app
/opt/conduit/venv/bin/pip install ./backend            # MariaDB: ./backend[mysql]
/opt/conduit/venv/bin/pip install -r /etc/conduit/plugins.txt

conduit manage migrate
conduit manage collectstatic --noinput
conduit manage conduit_init      # creates defaults and prints the first-run setup code
```

Keep the setup code. The EVE static data import is queued now and runs as soon as the worker starts
(step 9); it takes about a minute.

### 9. Start the services

```bash
cp /opt/conduit/app/deploy/baremetal/supervisor/conduit.conf /etc/supervisor/conf.d/conduit.conf
# RHEL family: /etc/supervisord.d/conduit.ini, and the service is called supervisord
systemctl enable --now supervisor
supervisorctl reread && supervisorctl update
conduit status
```

You should see `conduit:web`, `conduit:worker` and `conduit:beat` as `RUNNING`.

Then set up the updater that installs updates and plugins approved on the website. It only acts when an
administrator has clicked Install:

```bash
cat > /etc/cron.d/conduit-update <<'CRON'
*/2 * * * * root /usr/local/bin/conduit apply-update >/dev/null 2>&1
CRON
chmod 0644 /etc/cron.d/conduit-update
systemctl enable --now cron     # RHEL family: crond
conduit setup-updater           # the systemd path unit that starts within seconds; cron is the backup
```

### 10. Register the EVE application

Follow [step 4 of the quick install](#4-register-an-eve-application), put the Client ID and Secret Key
into `/etc/conduit/conduit.env` and run `conduit restart`.

### 11. nginx and HTTPS

```bash
sed 's/auth\.example\.com/YOUR-DOMAIN/g' /opt/conduit/app/deploy/baremetal/nginx/conduit.conf \
    > /etc/nginx/sites-available/conduit.conf
ln -s /etc/nginx/sites-available/conduit.conf /etc/nginx/sites-enabled/conduit.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl enable --now nginx && systemctl reload nginx

certbot --nginx -d YOUR-DOMAIN -m you@example.com --agree-tos --redirect
```

RHEL family: put the file in `/etc/nginx/conf.d/conduit.conf` (there is no `sites-enabled`), then allow
nginx through SELinux and the firewall:

```bash
setsebool -P httpd_can_network_connect 1
restorecon -R /var/www/conduit
firewall-cmd --permanent --add-service=http --add-service=https && firewall-cmd --reload
```

For a site on an IP address, run `conduit ip-cert` instead of certbot.

### 12. First login

Open your site, sign in with your main character, and enter the setup code from step 8 (`conduit
setup-code` prints it again). The wizard then walks you through branding and plugins.

## Troubleshooting

| Problem | What to check |
|---|---|
| Browser warns about the certificate, or HTTPS does not work | certbot failed. Check that `getent hosts auth.example.com` gives this server's public IP and that port 80 is reachable from the internet, then run `sudo certbot --nginx -d auth.example.com` (or `sudo conduit ip-cert` for an IP address). |
| `502 Bad Gateway` | The application is not running. `sudo conduit status`, then `sudo conduit logs web` for the error. On RHEL, SELinux must allow nginx to connect (`setsebool -P httpd_can_network_connect 1`). |
| EVE login fails with `invalid_scope` | A scope is missing on the EVE application. Edit it at developers.eveonline.com and select every scope. |
| EVE login fails with a redirect or callback error | The callback URL on the EVE application must be exactly `https://<your domain>/sso/callback` and match `CONDUIT_SITE_URL`. |
| `Bad Request (400)` after signing in | `CONDUIT_ALLOWED_HOSTS` in `conduit.env` does not contain the domain in the address bar. Fix it and `sudo conduit restart`. |
| "EvE Conduit is already installed" from the script | There is a `/etc/conduit/conduit.env` from an earlier attempt. Use `sudo conduit upgrade <tarball>` for a new version, or remove `/etc/conduit`, `/opt/conduit`, `/var/www/conduit`, `/var/lib/conduit` and the database to start over. |
| Updates approved on the website never install | `systemctl status conduit-update.path` and `/etc/cron.d/conduit-update` must exist; `sudo conduit setup-updater` recreates the unit. `sudo conduit apply-update` runs it by hand and shows errors. |
| Site not reachable from the internet | The server's firewall (`ufw status` or `firewall-cmd --list-all`), the cloud provider's firewall or security group, and the router's port forwarding on a home connection. |

## Coming from Alliance Auth or SeAT?

The layout follows the same pattern, with different paths and names:

| | Alliance Auth | SeAT | EvE Conduit |
|---|---|---|---|
| Service user | `allianceserver` | `www-data` | `conduit` |
| Code | `/home/allianceserver/myauth` | `/var/www/seat` | `/opt/conduit/app` |
| Settings | `settings/local.py` | `.env` | `/etc/conduit/conduit.env` |
| Processes | Supervisor | Supervisor (Horizon) | Supervisor |
| Scheduler | Celery beat | cron + `schedule:run` | Celery beat |
| First admin | `createsuperuser` | first login + config | setup code from the installer |
| Static data | not covered in the install guide | `artisan eve:update:sde` | automatic, or `conduit manage sde_update` |

Moving your members over from SeAT, with their characters, tokens and squads, is covered in
[tools/seat-import](../tools/seat-import/README.md).
