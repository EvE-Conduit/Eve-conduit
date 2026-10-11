#!/usr/bin/env bash
# Removes a bare-metal EvE Conduit install (the one deploy/baremetal/install.sh made).
#
#   sudo conduit uninstall                    (or: sudo ./deploy/baremetal/uninstall.sh from a release)
#
# It asks what to do:
#   1. Remove everything, including the database. Offers to save a final backup somewhere else first.
#   2. Remove the programs but keep the configuration (/etc/conduit), the database and the backups,
#      so a later install of the same version can pick them up.
#
# What it undoes: the Supervisor programs, the updater (systemd units and cron jobs), the nginx site, the
# database and its database role (mode 1), and the install's folders. What it leaves alone: the system packages
# (nginx, PostgreSQL/MariaDB, Redis, Supervisor, certbot), Let's Encrypt certificates, firewall rules, and
# every user account on the machine. It never deletes a Linux user, including the "conduit" service account.
#
# Options:
#   --mode all|keep-data   answer the question in advance
#   --backup-to DIR        folder (outside the install) to save a final backup to before removing everything
#   --no-backup            don't offer a backup
#   --yes                  don't ask anything (needs --mode)
set -euo pipefail

CONDUIT_HOME=${CONDUIT_HOME:-/opt/conduit}
CONDUIT_ETC=${CONDUIT_ETC:-/etc/conduit}
CONDUIT_WWW=${CONDUIT_WWW:-/var/www/conduit}
CONDUIT_LOG=${CONDUIT_LOG:-/var/log/conduit}
CONDUIT_STATE=${CONDUIT_STATE:-/var/lib/conduit}
CONDUIT_BACKUPS=${CONDUIT_BACKUPS:-/var/backups/conduit}
ENV_FILE="$CONDUIT_ETC/conduit.env"

MODE="" BACKUP_TO="" NO_BACKUP=0 ASSUME_YES=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode) MODE="$2"; shift 2 ;;
    --backup-to) BACKUP_TO="$2"; shift 2 ;;
    --no-backup) NO_BACKUP=1; shift ;;
    --yes | -y) ASSUME_YES=1; shift ;;
    -h | --help) sed -n '2,21p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
done

step() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
die() { printf '\033[1;31mError:\033[0m %s\n' "$*" >&2; exit 1; }
note() { printf '  %s\n' "$*"; }

[[ $EUID -eq 0 ]] || die "run as root (sudo $0 ...)"
[[ -z "$MODE" || "$MODE" == all || "$MODE" == keep-data ]] || die "--mode must be all or keep-data"
[[ $ASSUME_YES -eq 0 || -n "$MODE" ]] || die "--yes needs --mode all or --mode keep-data"
if [[ ! -e "$ENV_FILE" && ! -d "$CONDUIT_HOME" ]]; then
  die "EvE Conduit doesn't seem to be installed here (no $ENV_FILE and no $CONDUIT_HOME)"
fi

# --- what is installed ---------------------------------------------------------------------------------
DATABASE_URL=""
[[ -f "$ENV_FILE" ]] && DATABASE_URL=$(sed -n 's/^DATABASE_URL=//p' "$ENV_FILE" | tail -1)
DB_KIND="" DB_NAME="" DB_USER=""
if [[ -n "$DATABASE_URL" ]] && command -v python3 >/dev/null; then
  read -r DB_KIND DB_NAME DB_USER < <(python3 - "$DATABASE_URL" <<'PY'
import sys
from urllib.parse import unquote, urlparse
u = urlparse(sys.argv[1])
kind = "postgres" if u.scheme.startswith("postgres") else "mysql" if u.scheme.startswith("mysql") else ""
print(kind, u.path.lstrip("/") or "-", unquote(u.username or "") or "-")
PY
  )
fi
[[ "$DB_NAME" == "-" ]] && DB_NAME=""
[[ "$DB_USER" == "-" ]] && DB_USER=""

if [[ -f /etc/supervisor/conf.d/conduit.conf ]]; then
  SUPERVISOR_CONF=/etc/supervisor/conf.d/conduit.conf
elif [[ -f /etc/supervisord.d/conduit.ini ]]; then
  SUPERVISOR_CONF=/etc/supervisord.d/conduit.ini
else
  SUPERVISOR_CONF=""
fi

echo "This removes EvE Conduit from this machine."
echo "  code and services:  $CONDUIT_HOME, $CONDUIT_WWW, $CONDUIT_LOG, $CONDUIT_STATE, /usr/local/bin/conduit"
echo "  configuration:      $CONDUIT_ETC"
if [[ -n "$DB_KIND" ]]; then
  echo "  database:           $DB_KIND database '$DB_NAME' and database role '$DB_USER' (on this machine, if local)"
else
  echo "  database:           none found in $ENV_FILE"
fi
echo "  backups:            $CONDUIT_BACKUPS"
echo "Left alone: the system packages, Let's Encrypt certificates, firewall rules and every user account."
echo

if [[ -z "$MODE" ]]; then
  echo "What should be removed?"
  echo "  1) Everything, including the database and the configuration"
  echo "  2) The programs only; keep $CONDUIT_ETC, the database and $CONDUIT_BACKUPS"
  echo "  3) Cancel"
  read -r -p "Choose [1/2/3]: " answer
  case "$answer" in
    1) MODE=all ;;
    2) MODE=keep-data ;;
    *) echo "Cancelled."; exit 0 ;;
  esac
fi

# --- final backup (mode all) ------------------------------------------------------------------------------
if [[ $MODE == all && $NO_BACKUP -eq 0 && -x /usr/local/bin/conduit && -f "$ENV_FILE" ]]; then
  if [[ -z "$BACKUP_TO" && $ASSUME_YES -eq 0 ]]; then
    read -r -p "Save a final backup (database and configuration) to a folder outside the install first? Folder, or Enter to skip: " BACKUP_TO
  fi
  if [[ -n "$BACKUP_TO" ]]; then
    case "$BACKUP_TO" in
      "$CONDUIT_HOME"* | "$CONDUIT_ETC"* | "$CONDUIT_BACKUPS"* | "$CONDUIT_STATE"* | "$CONDUIT_WWW"*)
        die "--backup-to must be outside the folders being removed" ;;
    esac
    step "Saving a final backup"
    mkdir -p "$BACKUP_TO"
    if /usr/local/bin/conduit backup; then
      latest=$(ls -t "$CONDUIT_BACKUPS"/conduit-*.tar.gz 2>/dev/null | head -1)
      [[ -n "$latest" ]] || die "the backup didn't produce a file in $CONDUIT_BACKUPS"
      cp -p "$latest" "$BACKUP_TO/"
      chmod 600 "$BACKUP_TO/$(basename "$latest")"
      note "saved $BACKUP_TO/$(basename "$latest") (contains secrets; keep it safe)"
    else
      die "the backup failed; nothing has been removed. Fix that or run again with --no-backup"
    fi
  fi
fi

if [[ $ASSUME_YES -eq 0 ]]; then
  if [[ $MODE == all ]]; then
    echo
    echo "This deletes the database '$DB_NAME' and the configuration (including the key that decrypts members'"
    echo "stored EVE logins). It cannot be undone."
    read -r -p "Type DELETE to continue: " confirm
    [[ "$confirm" == DELETE ]] || { echo "Cancelled."; exit 0; }
  else
    read -r -p "Remove the programs and keep the data? [y/N] " confirm
    [[ "$confirm" =~ ^[Yy]$ ]] || { echo "Cancelled."; exit 0; }
  fi
fi

# --- 1. services --------------------------------------------------------------------------------------------
step "Stopping the services"
if command -v supervisorctl >/dev/null; then
  supervisorctl stop 'conduit:*' >/dev/null 2>&1 || true
  if [[ -n "$SUPERVISOR_CONF" ]]; then
    rm -f "$SUPERVISOR_CONF"
    supervisorctl reread >/dev/null 2>&1 || true
    supervisorctl update >/dev/null 2>&1 || true
    note "removed the Supervisor programs"
  fi
fi

step "Removing the updater"
if command -v systemctl >/dev/null; then
  systemctl disable --now conduit-update.path >/dev/null 2>&1 || true
  systemctl stop conduit-update.service >/dev/null 2>&1 || true
  rm -f /etc/systemd/system/conduit-update.path /etc/systemd/system/conduit-update.service
  systemctl daemon-reload >/dev/null 2>&1 || true
fi
rm -f /etc/cron.d/conduit-update /etc/cron.d/conduit-certbot /etc/cron.d/conduit-backup
note "removed the systemd units and cron jobs"

# --- 2. nginx -----------------------------------------------------------------------------------------------
step "Removing the nginx site"
removed=0
for f in /etc/nginx/sites-enabled/conduit.conf /etc/nginx/sites-available/conduit.conf /etc/nginx/conf.d/conduit.conf; do
  [[ -e "$f" || -L "$f" ]] && { rm -f "$f"; removed=1; }
done
if [[ $removed -eq 1 ]] && command -v nginx >/dev/null; then
  if nginx -t >/dev/null 2>&1; then systemctl reload nginx >/dev/null 2>&1 || true; fi
  note "removed the site; nginx keeps running (its default site was removed at install, so it serves nothing now)"
else
  note "no nginx site found"
fi

# --- 3. database (mode all) ----------------------------------------------------------------------------------
if [[ $MODE == all && -n "$DB_KIND" ]]; then
  step "Dropping the $DB_KIND database"
  if [[ $DB_KIND == postgres ]]; then
    if id postgres >/dev/null 2>&1 && command -v psql >/dev/null; then
      # The database role is the install's own; this is not a Linux user account.
      runuser -u postgres -- psql -v ON_ERROR_STOP=1 -q -c "DROP DATABASE IF EXISTS \"$DB_NAME\";" -c "DROP ROLE IF EXISTS \"$DB_USER\";" \
        && note "dropped database '$DB_NAME' and database role '$DB_USER'" \
        || note "could not drop the database; is PostgreSQL running? Drop '$DB_NAME' and the role '$DB_USER' by hand"
    else
      note "PostgreSQL isn't on this machine; drop '$DB_NAME' and the role '$DB_USER' on the database server by hand"
    fi
  else
    if command -v mariadb >/dev/null || command -v mysql >/dev/null; then
      cli=$(command -v mariadb || command -v mysql)
      "$cli" -u root -e "DROP DATABASE IF EXISTS \`$DB_NAME\`; DROP USER IF EXISTS '$DB_USER'@'localhost', '$DB_USER'@'127.0.0.1';" \
        && note "dropped database '$DB_NAME' and database user '$DB_USER'" \
        || note "could not drop the database; is MariaDB running? Drop '$DB_NAME' and the user '$DB_USER' by hand"
    else
      note "MariaDB isn't on this machine; drop '$DB_NAME' and the user '$DB_USER' on the database server by hand"
    fi
  fi
fi

# --- 4. files -------------------------------------------------------------------------------------------------
step "Deleting the files"
rm -rf "$CONDUIT_HOME" "$CONDUIT_WWW" "$CONDUIT_LOG" "$CONDUIT_STATE" /usr/local/bin/conduit
note "removed $CONDUIT_HOME, $CONDUIT_WWW, $CONDUIT_LOG, $CONDUIT_STATE and /usr/local/bin/conduit"
if [[ $MODE == all ]]; then
  rm -rf "$CONDUIT_ETC" "$CONDUIT_BACKUPS"
  note "removed $CONDUIT_ETC and $CONDUIT_BACKUPS"
else
  note "kept $CONDUIT_ETC, the database and $CONDUIT_BACKUPS"
fi

step "EvE Conduit has been removed"
if [[ $MODE == all ]]; then
  echo "To install again, unpack a release and run: sudo ./deploy/baremetal/install.sh --domain ... --email ..."
else
  echo "The configuration, database and backups are still here. A fresh install.sh refuses to run while"
  echo "$ENV_FILE exists; to reinstall the same version by hand, follow the manual steps in docs/install-linux.md"
  echo "from step 4 and reuse $ENV_FILE. To start over instead, run this again with --mode all."
fi
echo "No user account was changed. The system packages, certificates and firewall rules are still in place."
