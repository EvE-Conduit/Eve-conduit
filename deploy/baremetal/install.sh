#!/usr/bin/env bash
# EvE Conduit bare-metal installer.
#
# Automates the steps in docs/install-baremetal.md. Run it from an unpacked release:
#
#   tar -xzf eve-conduit-X.Y.Z.tar.gz && cd eve-conduit-X.Y.Z
#   sudo ./deploy/baremetal/install.sh --domain auth.example.com --email you@example.com
#
# Options:
#   --domain NAME        public hostname (required)
#   --email ADDRESS      contact for Let's Encrypt and CCP's ESI user agent (required)
#   --db postgres|mariadb   database to install and use (default: postgres)
#   --esi-client-id ID   EVE application client ID (can be added to the config later)
#   --esi-secret KEY     EVE application secret key
#   --no-tls             skip certbot (e.g. behind another proxy or for a LAN test)
#   --yes                don't ask for confirmation
#
# Supported: Ubuntu 22.04/24.04, Debian 12/13, Rocky/Alma/RHEL/CentOS Stream 9/10.
set -euo pipefail

DOMAIN="" EMAIL="" DB="postgres" ESI_ID="" ESI_SECRET="" TLS=1 ASSUME_YES=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain) DOMAIN="$2"; shift 2 ;;
    --email) EMAIL="$2"; shift 2 ;;
    --db) DB="$2"; shift 2 ;;
    --esi-client-id) ESI_ID="$2"; shift 2 ;;
    --esi-secret) ESI_SECRET="$2"; shift 2 ;;
    --no-tls) TLS=0; shift ;;
    --yes | -y) ASSUME_YES=1; shift ;;
    -h | --help) sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
done

RELEASE_SRC=$(cd "$(dirname "$0")/../.." && pwd)
EVECSM_HOME=/opt/evecsm
EVECSM_ETC=/etc/evecsm
EVECSM_WWW=/var/www/evecsm
EVECSM_LOG=/var/log/evecsm
SERVICE_USER=evecsm

step() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
die() { printf '\033[1;31mError:\033[0m %s\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "run as root (sudo $0 ...)"
[[ -n "$DOMAIN" ]] || die "--domain is required"
[[ -n "$EMAIL" ]] || die "--email is required (Let's Encrypt and CCP's ESI contact)"
[[ "$DB" == postgres || "$DB" == mariadb ]] || die "--db must be postgres or mariadb"
[[ -f "$RELEASE_SRC/VERSION" && -d "$RELEASE_SRC/web" ]] || die "run this from an unpacked release (see docs/install-baremetal.md)"
VERSION=$(cat "$RELEASE_SRC/VERSION")
[[ -e "$EVECSM_ETC/evecsm.env" ]] && die "EvE Conduit is already installed; use 'sudo evecsm upgrade <release.tar.gz>'"

# --- detect the OS ------------------------------------------------------------
. /etc/os-release
case "$ID" in
  ubuntu | debian) FAMILY=debian ;;
  rocky | almalinux | rhel | centos) FAMILY=rhel ;;
  *) die "unsupported distribution: $PRETTY_NAME" ;;
esac
MAJOR=${VERSION_ID%%.*}
case "$ID:$MAJOR" in
  ubuntu:22 | ubuntu:24 | debian:12 | debian:13 | rocky:9 | rocky:10 | almalinux:9 | almalinux:10 | rhel:9 | rhel:10 | centos:9 | centos:10) ;;
  *) echo "Warning: $PRETTY_NAME is not a tested release; continuing." ;;
esac

echo "Installing EvE Conduit $VERSION on $PRETTY_NAME"
echo "  site:     https://$DOMAIN"
echo "  database: $DB"
if [[ $ASSUME_YES -eq 0 ]]; then
  read -r -p "Continue? [y/N] " answer
  [[ "$answer" =~ ^[Yy]$ ]] || exit 1
fi

# --- 1. packages ----------------------------------------------------------------
step "Installing system packages"
if [[ $FAMILY == debian ]]; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -q
  pkgs=(curl ca-certificates build-essential pkg-config python3 python3-venv nginx redis-server supervisor certbot python3-certbot-nginx)
  if [[ $DB == postgres ]]; then pkgs+=(postgresql postgresql-client); else pkgs+=(mariadb-server mariadb-client libmariadb-dev); fi
  apt-get install -y -q "${pkgs[@]}"
  REDIS_SERVICE=redis-server
  SUPERVISOR_SERVICE=supervisor
  SUPERVISOR_CONF=/etc/supervisor/conf.d/evecsm.conf
  NGINX_CONF=/etc/nginx/sites-available/evecsm.conf
else
  dnf install -y -q epel-release 2>/dev/null || dnf install -y -q "https://dl.fedoraproject.org/pub/epel/epel-release-latest-$MAJOR.noarch.rpm"
  pkgs=(curl gcc make pkgconf python3 nginx supervisor certbot python3-certbot-nginx policycoreutils-python-utils)
  if [[ $DB == postgres ]]; then pkgs+=(postgresql-server postgresql); else pkgs+=(mariadb-server mariadb mariadb-connector-c-devel); fi
  # RHEL 10 ships Valkey (a Redis fork, same protocol) instead of Redis.
  if dnf info -q redis >/dev/null 2>&1; then pkgs+=(redis); REDIS_SERVICE=redis; else pkgs+=(valkey); REDIS_SERVICE=valkey; fi
  dnf install -y -q "${pkgs[@]}"
  SUPERVISOR_SERVICE=supervisord
  SUPERVISOR_CONF=/etc/supervisord.d/evecsm.ini
  NGINX_CONF=/etc/nginx/conf.d/evecsm.conf
fi
systemctl enable --now "$REDIS_SERVICE"

# --- 2. service user and directories ---------------------------------------------
step "Creating the $SERVICE_USER user and directories"
id "$SERVICE_USER" >/dev/null 2>&1 || useradd --system --home-dir "$EVECSM_HOME" --shell /usr/sbin/nologin "$SERVICE_USER"
install -d -o root -g "$SERVICE_USER" -m 0755 "$EVECSM_HOME" "$EVECSM_HOME/releases"
install -d -o root -g "$SERVICE_USER" -m 0750 "$EVECSM_ETC"
install -d -o "$SERVICE_USER" -g "$SERVICE_USER" -m 0755 "$EVECSM_LOG"
install -d -o root -g root -m 0755 "$EVECSM_WWW" "$EVECSM_WWW/web"
install -d -o "$SERVICE_USER" -g "$SERVICE_USER" -m 0755 "$EVECSM_WWW/static"
# Writable state (the scheduler's bookkeeping) lives outside the code.
install -d -o "$SERVICE_USER" -g "$SERVICE_USER" -m 0750 /var/lib/evecsm

RELEASE_DIR="$EVECSM_HOME/releases/$VERSION"
mkdir -p "$RELEASE_DIR"
cp -a "$RELEASE_SRC/." "$RELEASE_DIR/"
chown -R root:"$SERVICE_USER" "$RELEASE_DIR"
ln -sfn "$RELEASE_DIR" "$EVECSM_HOME/app"
install -m 0755 "$RELEASE_DIR/deploy/baremetal/evecsm" /usr/local/bin/evecsm

# --- 3. Python 3.12 and the virtualenv -----------------------------------------------
step "Setting up Python"
# uv gives every supported distro the same Python 3.12, without third-party repos.
python3 -m venv "$EVECSM_HOME/tools"
"$EVECSM_HOME/tools/bin/pip" install -q --upgrade pip uv
UV="$EVECSM_HOME/tools/bin/uv"
UV_PYTHON_INSTALL_DIR="$EVECSM_HOME/python" "$UV" python install 3.12
UV_PYTHON_INSTALL_DIR="$EVECSM_HOME/python" "$UV" venv --seed --python 3.12 "$EVECSM_HOME/venv"
# The venv stays root-owned: the service can run the code but not change it.

# --- 4. database --------------------------------------------------------------------
step "Setting up $DB"
DB_PASSWORD=$(head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 32)
if [[ $DB == postgres ]]; then
  if [[ $FAMILY == rhel ]]; then
    [[ -f /var/lib/pgsql/data/PG_VERSION ]] || postgresql-setup --initdb
    # RHEL defaults to "ident" for TCP logins; the app logs in with a password.
    sed -i -E 's/^(host\s+all\s+all\s+(127\.0\.0\.1\/32|::1\/128)\s+)ident/\1scram-sha-256/' /var/lib/pgsql/data/pg_hba.conf
  fi
  systemctl enable --now postgresql
  systemctl reload postgresql
  runuser -u postgres -- psql -v ON_ERROR_STOP=1 -q <<SQL
CREATE USER evecsm WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE evecsm OWNER evecsm ENCODING 'UTF8';
SQL
  DATABASE_URL="postgres://evecsm:$DB_PASSWORD@127.0.0.1:5432/evecsm"
else
  systemctl enable --now mariadb
  mariadb -u root <<SQL
CREATE DATABASE evecsm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'evecsm'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
CREATE USER 'evecsm'@'127.0.0.1' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON evecsm.* TO 'evecsm'@'localhost';
GRANT ALL PRIVILEGES ON evecsm.* TO 'evecsm'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL
  DATABASE_URL="mysql://evecsm:$DB_PASSWORD@127.0.0.1:3306/evecsm"
  echo "Tip: run mariadb-secure-installation afterwards to remove test users and databases."
fi

# --- 5. configuration -------------------------------------------------------------------
step "Writing $EVECSM_ETC/evecsm.env"
SECRET_KEY=$(head -c 64 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 60)
TOKEN_KEY=$(head -c 32 /dev/urandom | base64 | tr '+/' '-_')
SCHEME=https
[[ $TLS -eq 1 ]] || SCHEME=http
umask 027
cat > "$EVECSM_ETC/evecsm.env" <<ENV
# Written by install.sh on $(date -u +%Y-%m-%d). Apply changes with: sudo evecsm restart
EVECSM_SECRET_KEY=$SECRET_KEY
EVECSM_TOKEN_KEY=$TOKEN_KEY
EVECSM_SITE_URL=$SCHEME://$DOMAIN
EVECSM_ALLOWED_HOSTS=$DOMAIN
EVECSM_STATIC_ROOT=$EVECSM_WWW/static
DATABASE_URL=$DATABASE_URL
REDIS_URL=redis://127.0.0.1:6379/0
# From https://developers.eveonline.com/applications (callback: $SCHEME://$DOMAIN/sso/callback)
ESI_CLIENT_ID=$ESI_ID
ESI_SECRET_KEY=$ESI_SECRET
ESI_USER_AGENT_CONTACT=$EMAIL
ENV
umask 022
chown root:"$SERVICE_USER" "$EVECSM_ETC/evecsm.env"
chmod 0640 "$EVECSM_ETC/evecsm.env"
grep -v '^\s*#' "$RELEASE_DIR/requirements-modules.txt" | sed '/^\s*$/d' > "$EVECSM_ETC/modules.txt"
chown root:"$SERVICE_USER" "$EVECSM_ETC/modules.txt"

# --- 6. application ---------------------------------------------------------------------
step "Installing EvE Conduit $VERSION"
EXTRAS=""
[[ $DB == mariadb ]] && EXTRAS="[mysql]"
(cd "$RELEASE_DIR" && "$EVECSM_HOME/venv/bin/python" -m pip install -q "./backend$EXTRAS")
(cd "$RELEASE_DIR" && "$EVECSM_HOME/venv/bin/python" -m pip install -q -r "$EVECSM_ETC/modules.txt")
cp -a "$RELEASE_DIR/web/." "$EVECSM_WWW/web/"
evecsm manage migrate --noinput
evecsm manage collectstatic --noinput -v0
SETUP_OUTPUT=$(evecsm manage evecsm_init)

# --- 7. services ---------------------------------------------------------------------------
step "Configuring Supervisor"
install -m 0644 "$RELEASE_DIR/deploy/baremetal/supervisor/evecsm.conf" "$SUPERVISOR_CONF"
systemctl enable --now "$SUPERVISOR_SERVICE"
supervisorctl reread >/dev/null
supervisorctl update
sleep 3
supervisorctl status 'evecsm:*' || true

step "Configuring nginx"
sed "s/auth\.example\.com/$DOMAIN/g" "$RELEASE_DIR/deploy/baremetal/nginx/evecsm.conf" > "$NGINX_CONF"
if [[ $FAMILY == debian ]]; then
  ln -sfn "$NGINX_CONF" /etc/nginx/sites-enabled/evecsm.conf
  rm -f /etc/nginx/sites-enabled/default
fi
if command -v getenforce >/dev/null && [[ "$(getenforce)" == Enforcing ]]; then
  # Let nginx reach the app on 127.0.0.1:8000 and serve /var/www/evecsm.
  setsebool -P httpd_can_network_connect 1
  restorecon -R "$EVECSM_WWW"
fi
if command -v firewall-cmd >/dev/null && firewall-cmd --state >/dev/null 2>&1; then
  firewall-cmd -q --permanent --add-service=http --add-service=https && firewall-cmd -q --reload
fi
nginx -t
systemctl enable --now nginx
systemctl reload nginx

if [[ $TLS -eq 1 ]]; then
  step "Requesting a Let's Encrypt certificate"
  if ! certbot --nginx -d "$DOMAIN" -m "$EMAIL" --agree-tos --non-interactive --redirect; then
    echo "certbot failed (is DNS for $DOMAIN pointing here and port 80 open?)."
    echo "Fix that, then run: sudo certbot --nginx -d $DOMAIN"
  fi
fi

# --- done ---------------------------------------------------------------------------------
step "EvE Conduit $VERSION is installed"
echo "$SETUP_OUTPUT" | grep -iE "setup code|ESI_CLIENT" || true
cat <<DONE

Next steps:
  1. Create an EVE application at https://developers.eveonline.com/applications
     with callback URL: $SCHEME://$DOMAIN/sso/callback
  2. Put its Client ID and Secret Key in $EVECSM_ETC/evecsm.env, then: sudo evecsm restart
  3. Open $SCHEME://$DOMAIN, sign in, and enter the setup code above.

Day to day: sudo evecsm status | logs | backup | upgrade <release.tar.gz>
DONE
