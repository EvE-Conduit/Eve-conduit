# Bare-metal installation

This guide installs EvE Conduit directly on a Linux server, the same way Alliance Auth and SeAT
document their manual installs. Prefer containers? See the Docker section of the README.

Every step below is also automated by `deploy/baremetal/install.sh`. Run the script, or follow the
steps by hand to see what it does. Either way, read this page once.

**Supported:** Ubuntu 22.04 / 24.04, Debian 12 / 13, Rocky Linux / AlmaLinux / RHEL / CentOS Stream 9 / 10.

**You need:** a server with 2+ CPU cores, 4 GB RAM and 20 GB disk; a domain name pointing at it (or a fixed
public IPv4 address, see [No domain](#no-domain)); ports 80 and 443 open; root access.

| Piece | What we use |
|---|---|
| Application | Python 3.12 in a virtualenv, gunicorn on `127.0.0.1:8000` |
| Database | PostgreSQL (recommended) or MariaDB |
| Cache and task queue | Redis (Valkey on RHEL 10) |
| Background jobs | Celery worker and Celery beat |
| Process manager | Supervisor |
| Web server | nginx, with Let's Encrypt via certbot |

## Quick install (script)

```bash
tar -xzf eve-conduit-X.Y.Z.tar.gz
cd eve-conduit-X.Y.Z
sudo ./deploy/baremetal/install.sh --domain auth.example.com --email you@example.com
# add --db mariadb to use MariaDB instead of PostgreSQL
```

The script prints a **setup code** when it finishes. Continue with
[Register the EVE application](#9-register-the-eve-application).

### No domain

Pass the server's public IPv4 address instead: `--domain 203.0.113.7`. The site is then `https://203.0.113.7` and the
EVE callback URL `https://203.0.113.7/sso/callback`. The address must not change (ask your provider for a static IP): the EVE login's callback URL and the certificate are tied to it. Private addresses (192.168.x.x, 10.x.x.x) and connections behind carrier-grade NAT can't get a certificate; use plain HTTP for a site that's only on your local network.

Let's Encrypt only issues IP address certificates valid for six days, and only certbot 5.4 or newer can ask for them
(the distributions' certbot is older). `sudo conduit ip-cert`, which the installer runs, installs that certbot in
`/opt/conduit/certbot`, keeps its files in `/etc/conduit/letsencrypt`, adds HTTPS to the nginx site and renews from
`/etc/cron.d/conduit-certbot` every four hours. If the certificate request failed, fix the cause (usually port 80 not
reachable from the internet) and run `sudo conduit ip-cert` again. Running it again is always safe.

## Manual install

Commands are for Ubuntu/Debian. RHEL-family equivalents are noted where they differ. Run everything as
root (`sudo -i`) unless the step says otherwise.

### 1. Prepare the system

```bash
apt-get update && apt-get full-upgrade -y
```
RHEL family: `dnf upgrade -y && dnf install -y epel-release`

### 2. Install packages

```bash
apt-get install -y curl ca-certificates build-essential pkg-config python3 python3-venv \
    nginx redis-server supervisor certbot python3-certbot-nginx
# PostgreSQL (recommended):
apt-get install -y postgresql postgresql-client
# ...or MariaDB:
apt-get install -y mariadb-server mariadb-client libmariadb-dev

systemctl enable --now redis-server
```

RHEL family:

```bash
dnf install -y curl gcc make pkgconf python3 nginx supervisor certbot python3-certbot-nginx \
    policycoreutils-python-utils redis            # RHEL 10: valkey instead of redis
dnf install -y postgresql-server postgresql       # or: mariadb-server mariadb mariadb-connector-c-devel
systemctl enable --now redis                      # RHEL 10: valkey
```

### 3. Create the service user and directories

```bash
useradd --system --home-dir /opt/conduit --shell /usr/sbin/nologin conduit
install -d -o root   -g conduit -m 0755 /opt/conduit /opt/conduit/releases
install -d -o root   -g conduit -m 0750 /etc/conduit
install -d -o conduit -g conduit -m 0755 /var/log/conduit /var/www/conduit/static
install -d -o conduit -g conduit -m 0750 /var/lib/conduit
install -d -o root   -g root   -m 0755 /var/www/conduit/web
```

| Path | Contents |
|---|---|
| `/opt/conduit/releases/<version>` | unpacked releases; `/opt/conduit/app` points at the current one |
| `/opt/conduit/venv` | Python virtualenv (owned by root, so the service can't change its own code) |
| `/etc/conduit/conduit.env` | configuration and secrets |
| `/etc/conduit/plugins.txt` | installed plugins |
| `/var/www/conduit/web`, `/static` | files nginx serves directly |
| `/var/log/conduit` | service logs |
| `/var/lib/conduit` | scheduler state |

### 4. Unpack the release

```bash
tar -xzf eve-conduit-X.Y.Z.tar.gz -C /opt/conduit/releases
mv /opt/conduit/releases/eve-conduit-X.Y.Z /opt/conduit/releases/X.Y.Z
chown -R root:conduit /opt/conduit/releases/X.Y.Z
ln -sfn /opt/conduit/releases/X.Y.Z /opt/conduit/app
install -m 0755 /opt/conduit/app/deploy/baremetal/conduit /usr/local/bin/conduit
cp -a /opt/conduit/app/web/. /var/www/conduit/web/
```

### 5. Python 3.12 and the virtualenv

EvE Conduit needs Python 3.12 or newer. Ubuntu 22.04 and Debian 12 ship older versions, so we use
[uv](https://docs.astral.sh/uv/) to get the same Python everywhere, without adding package repositories:

```bash
python3 -m venv /opt/conduit/tools
/opt/conduit/tools/bin/pip install --upgrade pip uv
UV_PYTHON_INSTALL_DIR=/opt/conduit/python /opt/conduit/tools/bin/uv python install 3.12
UV_PYTHON_INSTALL_DIR=/opt/conduit/python /opt/conduit/tools/bin/uv venv --seed --python 3.12 /opt/conduit/venv
```

### 6. Create the database

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
SQL
mariadb-secure-installation
```

### 7. Configure EvE Conduit

```bash
cp /opt/conduit/app/deploy/baremetal/conduit.env.example /etc/conduit/conduit.env
chown root:conduit /etc/conduit/conduit.env && chmod 0640 /etc/conduit/conduit.env
nano /etc/conduit/conduit.env
```

Set at least:

- `CONDUIT_SECRET_KEY`: a long random string, e.g. `head -c 64 /dev/urandom | base64 | tr -dc A-Za-z0-9 | head -c 60`
- `CONDUIT_SITE_URL` and `CONDUIT_ALLOWED_HOSTS`: your domain
- `DATABASE_URL`: `postgres://conduit:PASSWORD@127.0.0.1:5432/conduit` or `mysql://conduit:PASSWORD@127.0.0.1:3306/conduit`
- `ESI_USER_AGENT_CONTACT`: your email. CCP asks every ESI application to identify itself.
- `ESI_CLIENT_ID` / `ESI_SECRET_KEY`: can wait until [step 9](#9-register-the-eve-application)

Then list the plugins to install:

```bash
grep -v '^\s*#' /opt/conduit/app/requirements-plugins.txt | sed '/^\s*$/d' > /etc/conduit/plugins.txt
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

The EVE static data import is queued and runs as soon as the worker starts (step 10). It takes about
a minute.

### 9. Register the EVE application

1. Go to <https://developers.eveonline.com/applications> and create an application with
   **Authentication & API Access**.
2. Callback URL: `https://auth.example.com/sso/callback` (your domain).
3. Select all scopes. Sign-in asks members for every one of them; a scope missing here makes the EVE
   login fail with `invalid_scope` (or narrow the request with `ESI_SCOPES` in `conduit.env`).
4. Put the **Client ID** and **Secret Key** into `/etc/conduit/conduit.env`.

### 10. Start the services (Supervisor)

```bash
cp /opt/conduit/app/deploy/baremetal/supervisor/conduit.conf /etc/supervisor/conf.d/conduit.conf
# RHEL family: /etc/supervisord.d/conduit.ini, and the service is called supervisord
systemctl enable --now supervisor
supervisorctl reread && supervisorctl update
conduit status
```

You should see `conduit:web`, `conduit:worker` and `conduit:beat` as `RUNNING`.

### 11. nginx and HTTPS

```bash
sed 's/auth\.example\.com/YOUR-DOMAIN/g' /opt/conduit/app/deploy/baremetal/nginx/conduit.conf \
    > /etc/nginx/sites-available/conduit.conf
ln -s /etc/nginx/sites-available/conduit.conf /etc/nginx/sites-enabled/conduit.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

certbot --nginx -d YOUR-DOMAIN --redirect
```

RHEL family: put the file in `/etc/nginx/conf.d/conduit.conf`, then allow nginx through SELinux and
the firewall:

```bash
setsebool -P httpd_can_network_connect 1
restorecon -R /var/www/conduit
firewall-cmd --permanent --add-service=http --add-service=https && firewall-cmd --reload
```

### 12. First login

Open your site, sign in with your main character, and enter the setup code from step 8. Lost it?
`sudo conduit setup-code` prints it again until setup is complete. The wizard then walks you through
branding and plugins.

## Running EvE Conduit

| Task | Command |
|---|---|
| Service status | `sudo conduit status` |
| Restart after editing the config | `sudo conduit restart` |
| Follow logs | `sudo conduit logs web` (or `worker`, `beat`) |
| Any Django command | `sudo conduit manage <command>` |
| Back up database and config | `sudo conduit backup` (writes to `/var/backups/conduit`) |
| Install a plugin | `sudo conduit plugin install conduit-something` |
| List plugins | `sudo conduit plugin list` |

## Updating

```bash
sudo conduit upgrade eve-conduit-X.Y.Z.tar.gz
```

This backs up the database and config, installs the new release next to the old one, runs migrations,
publishes the new front end and restarts the services. If anything fails before the switch, the
running version is left untouched and you can retry.

If the new version misbehaves, `sudo conduit rollback` switches back to the previous release.
Database migrations are not undone. If the old version won't start, restore the backup taken during
the upgrade.

## Coming from Alliance Auth or SeAT?

The layout follows the same pattern, with different paths and names:

| | Alliance Auth | SeAT | EvE Conduit |
|---|---|---|---|
| Service user | `allianceserver` | `www-data` | `conduit` |
| Code | `/home/allianceserver/myauth` | `/var/www/seat` | `/opt/conduit/app` |
| Settings | `settings/local.py` | `.env` | `/etc/conduit/conduit.env` |
| Processes | Supervisor | Supervisor (Horizon) | Supervisor |
| Scheduler | Celery beat | cron + `schedule:run` | Celery beat |
| First admin | `createsuperuser` | first login + config | setup code from the logs |
| Static data | not covered in the install guide | `artisan eve:update:sde` | automatic, or `conduit manage sde_update` |
