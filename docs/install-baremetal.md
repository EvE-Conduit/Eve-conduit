# Bare-metal installation

This guide installs EVECSM directly on a Linux server, the same way Alliance Auth and SeAT
document their manual installs. Prefer containers? See the Docker section of the README.

Every step below is also automated by `deploy/baremetal/install.sh`. Run the script, or follow the
steps by hand to see what it does. Either way, read this page once.

**Supported:** Ubuntu 22.04 / 24.04, Debian 12 / 13, Rocky Linux / AlmaLinux / RHEL / CentOS Stream 9 / 10.

**You need:** a server with 2+ CPU cores, 4 GB RAM and 20 GB disk; a domain name pointing at it;
ports 80 and 443 open; root access.

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
tar -xzf evecsm-X.Y.Z.tar.gz
cd evecsm-X.Y.Z
sudo ./deploy/baremetal/install.sh --domain auth.example.com --email you@example.com
# add --db mariadb to use MariaDB instead of PostgreSQL
```

The script prints a **setup code** when it finishes. Continue with
[Register the EVE application](#9-register-the-eve-application).

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
useradd --system --home-dir /opt/evecsm --shell /usr/sbin/nologin evecsm
install -d -o root   -g evecsm -m 0755 /opt/evecsm /opt/evecsm/releases
install -d -o root   -g evecsm -m 0750 /etc/evecsm
install -d -o evecsm -g evecsm -m 0755 /var/log/evecsm /var/www/evecsm/static
install -d -o evecsm -g evecsm -m 0750 /var/lib/evecsm
install -d -o root   -g root   -m 0755 /var/www/evecsm/web
```

| Path | Contents |
|---|---|
| `/opt/evecsm/releases/<version>` | unpacked releases; `/opt/evecsm/app` points at the current one |
| `/opt/evecsm/venv` | Python virtualenv (owned by root, so the service can't change its own code) |
| `/etc/evecsm/evecsm.env` | configuration and secrets |
| `/etc/evecsm/modules.txt` | installed modules |
| `/var/www/evecsm/web`, `/static` | files nginx serves directly |
| `/var/log/evecsm` | service logs |
| `/var/lib/evecsm` | scheduler state |

### 4. Unpack the release

```bash
tar -xzf evecsm-X.Y.Z.tar.gz -C /opt/evecsm/releases
mv /opt/evecsm/releases/evecsm-X.Y.Z /opt/evecsm/releases/X.Y.Z
chown -R root:evecsm /opt/evecsm/releases/X.Y.Z
ln -sfn /opt/evecsm/releases/X.Y.Z /opt/evecsm/app
install -m 0755 /opt/evecsm/app/deploy/baremetal/evecsm /usr/local/bin/evecsm
cp -a /opt/evecsm/app/web/. /var/www/evecsm/web/
```

### 5. Python 3.12 and the virtualenv

EVECSM needs Python 3.12 or newer. Ubuntu 22.04 and Debian 12 ship older versions, so we use
[uv](https://docs.astral.sh/uv/) to get the same Python everywhere, without adding package repositories:

```bash
python3 -m venv /opt/evecsm/tools
/opt/evecsm/tools/bin/pip install --upgrade pip uv
UV_PYTHON_INSTALL_DIR=/opt/evecsm/python /opt/evecsm/tools/bin/uv python install 3.12
UV_PYTHON_INSTALL_DIR=/opt/evecsm/python /opt/evecsm/tools/bin/uv venv --seed --python 3.12 /opt/evecsm/venv
```

### 6. Create the database

**PostgreSQL:**

```bash
# RHEL family only: initialise, then allow password logins over TCP
postgresql-setup --initdb
sed -i -E 's/^(host\s+all\s+all\s+(127\.0\.0\.1\/32|::1\/128)\s+)ident/\1scram-sha-256/' /var/lib/pgsql/data/pg_hba.conf

systemctl enable --now postgresql
sudo -u postgres psql <<'SQL'
CREATE USER evecsm WITH PASSWORD 'CHOOSE-A-PASSWORD';
CREATE DATABASE evecsm OWNER evecsm ENCODING 'UTF8';
SQL
```

**MariaDB:**

```bash
systemctl enable --now mariadb
mariadb -u root <<'SQL'
CREATE DATABASE evecsm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'evecsm'@'localhost' IDENTIFIED BY 'CHOOSE-A-PASSWORD';
CREATE USER 'evecsm'@'127.0.0.1' IDENTIFIED BY 'CHOOSE-A-PASSWORD';
GRANT ALL PRIVILEGES ON evecsm.* TO 'evecsm'@'localhost';
GRANT ALL PRIVILEGES ON evecsm.* TO 'evecsm'@'127.0.0.1';
SQL
mariadb-secure-installation
```

### 7. Configure EVECSM

```bash
cp /opt/evecsm/app/deploy/baremetal/evecsm.env.example /etc/evecsm/evecsm.env
chown root:evecsm /etc/evecsm/evecsm.env && chmod 0640 /etc/evecsm/evecsm.env
nano /etc/evecsm/evecsm.env
```

Set at least:

- `EVECSM_SECRET_KEY`: a long random string, e.g. `head -c 64 /dev/urandom | base64 | tr -dc A-Za-z0-9 | head -c 60`
- `EVECSM_SITE_URL` and `EVECSM_ALLOWED_HOSTS`: your domain
- `DATABASE_URL`: `postgres://evecsm:PASSWORD@127.0.0.1:5432/evecsm` or `mysql://evecsm:PASSWORD@127.0.0.1:3306/evecsm`
- `ESI_USER_AGENT_CONTACT`: your email. CCP asks every ESI application to identify itself.
- `ESI_CLIENT_ID` / `ESI_SECRET_KEY`: can wait until [step 9](#9-register-the-eve-application)

Then list the modules to install:

```bash
grep -v '^\s*#' /opt/evecsm/app/requirements-modules.txt | sed '/^\s*$/d' > /etc/evecsm/modules.txt
```

### 8. Install the application and prepare the database

```bash
cd /opt/evecsm/app
/opt/evecsm/venv/bin/pip install ./backend            # MariaDB: ./backend[mysql]
/opt/evecsm/venv/bin/pip install -r /etc/evecsm/modules.txt

evecsm manage migrate
evecsm manage collectstatic --noinput
evecsm manage evecsm_init      # creates defaults and prints the first-run setup code
```

The EVE static data import is queued and runs as soon as the worker starts (step 10). It takes about
a minute.

### 9. Register the EVE application

1. Go to <https://developers.eveonline.com/applications> and create an application with
   **Authentication & API Access**.
2. Callback URL: `https://auth.example.com/sso/callback` (your domain).
3. Select all scopes. Sign-in asks members for every one of them; a scope missing here makes the EVE
   login fail with `invalid_scope` (or narrow the request with `ESI_SCOPES` in `evecsm.env`).
4. Put the **Client ID** and **Secret Key** into `/etc/evecsm/evecsm.env`.

### 10. Start the services (Supervisor)

```bash
cp /opt/evecsm/app/deploy/baremetal/supervisor/evecsm.conf /etc/supervisor/conf.d/evecsm.conf
# RHEL family: /etc/supervisord.d/evecsm.ini, and the service is called supervisord
systemctl enable --now supervisor
supervisorctl reread && supervisorctl update
evecsm status
```

You should see `evecsm:web`, `evecsm:worker` and `evecsm:beat` as `RUNNING`.

### 11. nginx and HTTPS

```bash
sed 's/auth\.example\.com/YOUR-DOMAIN/g' /opt/evecsm/app/deploy/baremetal/nginx/evecsm.conf \
    > /etc/nginx/sites-available/evecsm.conf
ln -s /etc/nginx/sites-available/evecsm.conf /etc/nginx/sites-enabled/evecsm.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

certbot --nginx -d YOUR-DOMAIN --redirect
```

RHEL family: put the file in `/etc/nginx/conf.d/evecsm.conf`, then allow nginx through SELinux and
the firewall:

```bash
setsebool -P httpd_can_network_connect 1
restorecon -R /var/www/evecsm
firewall-cmd --permanent --add-service=http --add-service=https && firewall-cmd --reload
```

### 12. First login

Open your site, sign in with your main character, and enter the setup code from step 8. Lost it?
`sudo evecsm setup-code` prints it again until setup is complete. The wizard then walks you through
branding and modules.

## Running EVECSM

| Task | Command |
|---|---|
| Service status | `sudo evecsm status` |
| Restart after editing the config | `sudo evecsm restart` |
| Follow logs | `sudo evecsm logs web` (or `worker`, `beat`) |
| Any Django command | `sudo evecsm manage <command>` |
| Back up database and config | `sudo evecsm backup` (writes to `/var/backups/evecsm`) |
| Install a module | `sudo evecsm module install evecsm-something` |
| List modules | `sudo evecsm module list` |

## Updating

```bash
sudo evecsm upgrade evecsm-X.Y.Z.tar.gz
```

This backs up the database and config, installs the new release next to the old one, runs migrations,
publishes the new front end and restarts the services. If anything fails before the switch, the
running version is left untouched and you can retry.

If the new version misbehaves, `sudo evecsm rollback` switches back to the previous release.
Database migrations are not undone. If the old version won't start, restore the backup taken during
the upgrade.

## Coming from Alliance Auth or SeAT?

The layout follows the same pattern, with different paths and names:

| | Alliance Auth | SeAT | EVECSM |
|---|---|---|---|
| Service user | `allianceserver` | `www-data` | `evecsm` |
| Code | `/home/allianceserver/myauth` | `/var/www/seat` | `/opt/evecsm/app` |
| Settings | `settings/local.py` | `.env` | `/etc/evecsm/evecsm.env` |
| Processes | Supervisor | Supervisor (Horizon) | Supervisor |
| Scheduler | Celery beat | cron + `schedule:run` | Celery beat |
| First admin | `createsuperuser` | first login + config | setup code from the logs |
| Static data | not covered in the install guide | `artisan eve:update:sde` | automatic, or `evecsm manage sde_update` |
