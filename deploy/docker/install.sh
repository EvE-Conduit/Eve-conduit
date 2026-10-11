#!/usr/bin/env bash
# EvE Conduit Docker installer: asks a few questions, writes .env with fresh secrets, builds and starts the stack
# and prints the one-time setup code. Run it from a clone of the repository:
#
#   git clone https://github.com/EvE-Conduit/Eve-conduit.git /opt/eve-conduit && cd /opt/eve-conduit
#   ./deploy/docker/install.sh
#
# Every question can be answered on the command line instead:
#   --domain NAME          public hostname, or the server's public IPv4 address (automatic HTTPS)
#   --http ADDRESS         no HTTPS: serve plain HTTP at this address (e.g. 192.168.1.10), for a LAN or a test
#   --email ADDRESS        contact for Let's Encrypt and CCP's ESI user agent
#   --esi-client-id ID     EVE application (optional; the setup wizard asks for it otherwise)
#   --esi-secret KEY
#   --no-start             write .env but don't build or start anything
#   --yes                  don't ask for confirmation (needs --domain or --http, and --email)
set -euo pipefail

DOMAIN="" HTTP_ADDRESS="" EMAIL="" ESI_ID="" ESI_SECRET="" START=1 ASSUME_YES=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain) DOMAIN="$2"; shift 2 ;;
    --http) HTTP_ADDRESS="$2"; shift 2 ;;
    --email) EMAIL="$2"; shift 2 ;;
    --esi-client-id) ESI_ID="$2"; shift 2 ;;
    --esi-secret) ESI_SECRET="$2"; shift 2 ;;
    --no-start) START=0; shift ;;
    --yes | -y) ASSUME_YES=1; shift ;;
    -h | --help) sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
done

step() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
die() { printf '\033[1;31mError:\033[0m %s\n' "$*" >&2; exit 1; }
note() { printf '  %s\n' "$*"; }
ask() {  # ask VAR "prompt" [default]
  local var="$1" prompt="$2" default="${3:-}" answer
  if [[ -n "$default" ]]; then read -r -p "$prompt [$default]: " answer; else read -r -p "$prompt: " answer; fi
  printf -v "$var" '%s' "${answer:-$default}"
}
random_token() { head -c "$1" /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c "$2"; }

# --- where we are ------------------------------------------------------------------------------------------------
REPO=$(cd "$(dirname "$0")/../.." && pwd)
cd "$REPO"
[[ -f docker-compose.yml && -f .env.example ]] || die "run this from a clone of the repository (docker-compose.yml not found in $REPO)"
if [[ -e .env ]]; then
  die ".env already exists: EvE Conduit is already set up here. Edit .env to change settings (then docker compose up -d), or move .env away to start over."
fi

# --- docker ------------------------------------------------------------------------------------------------------
if ! command -v docker >/dev/null; then
  echo "Docker isn't installed."
  if [[ $ASSUME_YES -eq 0 && "$(uname -s)" == Linux ]]; then
    read -r -p "Install it now with Docker's own script (curl -fsSL https://get.docker.com | sh)? [y/N] " answer
    if [[ "$answer" =~ ^[Yy]$ ]]; then
      curl -fsSL https://get.docker.com | sh
    fi
  fi
  command -v docker >/dev/null || die "install Docker first: https://docs.docker.com/engine/install/"
fi
if ! docker info >/dev/null 2>&1; then
  die "docker isn't usable by this user: run this script with sudo, or add yourself to the docker group (sudo usermod -aG docker \$USER, then log out and in)"
fi
docker compose version >/dev/null 2>&1 || die "the Docker Compose plugin is missing (docker compose version fails); see https://docs.docker.com/compose/install/"

# --- questions ---------------------------------------------------------------------------------------------------
echo "EvE Conduit Docker setup. Press Enter to accept a suggestion in [brackets]."
echo

if [[ -z "$DOMAIN" && -z "$HTTP_ADDRESS" ]]; then
  echo "How will members reach the site?"
  echo "  1) A domain name pointing at this server (e.g. auth.example.com): automatic HTTPS"
  echo "  2) This server's public IPv4 address, no domain: automatic HTTPS (the address must not change)"
  echo "  3) Plain HTTP on a local network or for a test (no certificate)"
  ask choice "Choose [1/2/3]" 1
  case "$choice" in
    1) ask DOMAIN "Domain name" ;;
    2) ask DOMAIN "Public IPv4 address" ;;
    3) ask HTTP_ADDRESS "Address people will type, without http:// (e.g. 192.168.1.10 or myserver)" ;;
    *) die "choose 1, 2 or 3" ;;
  esac
fi
DOMAIN=${DOMAIN#*://}; DOMAIN=${DOMAIN%%/*}
HTTP_ADDRESS=${HTTP_ADDRESS#*://}; HTTP_ADDRESS=${HTTP_ADDRESS%%/*}
[[ -n "$DOMAIN" || -n "$HTTP_ADDRESS" ]] || die "a domain, a public IP address or an HTTP address is required"
[[ -z "$DOMAIN" || -z "$HTTP_ADDRESS" ]] || die "give either --domain or --http, not both"

if [[ -n "$DOMAIN" ]]; then
  if [[ "$DOMAIN" =~ ^[0-9]{1,3}(\.[0-9]{1,3}){3}$ ]]; then
    IFS=. read -r o1 o2 o3 o4 <<<"$DOMAIN"
    for o in "$o1" "$o2" "$o3" "$o4"; do (( 10#$o <= 255 )) || die "$DOMAIN isn't a valid IP address"; done
    if (( o1 == 0 || o1 == 10 || o1 == 127 )) || (( o1 == 169 && o2 == 254 )) || (( o1 == 172 && o2 >= 16 && o2 <= 31 )) ||
       (( o1 == 192 && o2 == 168 )) || (( o1 == 100 && o2 >= 64 && o2 <= 127 )); then
      die "$DOMAIN is a private address, which can't get an HTTPS certificate. Use the server's public IP address or a domain name, or choose plain HTTP (--http $DOMAIN) for a local network."
    fi
  elif [[ "$DOMAIN" == *:* ]]; then
    die "$DOMAIN: IPv6 addresses and ports aren't supported here; use a domain name or the server's IPv4 address"
  elif [[ ! "$DOMAIN" =~ ^[A-Za-z0-9.-]+$ ]]; then
    die "$DOMAIN doesn't look like a domain name or IP address"
  fi
  SCHEME=https; HOST="$DOMAIN"
else
  [[ "$HTTP_ADDRESS" =~ ^[A-Za-z0-9.-]+(:[0-9]+)?$ ]] || die "$HTTP_ADDRESS doesn't look like an address"
  SCHEME=http; HOST="$HTTP_ADDRESS"
fi
SITE_URL="$SCHEME://$HOST"

[[ -n "$EMAIL" ]] || ask EMAIL "Your email address (Let's Encrypt and CCP's ESI contact)"
[[ "$EMAIL" == *@*.* ]] || die "$EMAIL doesn't look like an email address"
[[ "$EMAIL" != *@example.com ]] || die "Let's Encrypt refuses example.com addresses; use a real one"

if [[ -z "$ESI_ID" && $ASSUME_YES -eq 0 ]]; then
  echo
  echo "EVE application. Create one at"
  echo "  https://developers.eveonline.com/applications"
  echo "with Authentication & API Access, every scope selected, and this callback URL:"
  echo "  $SITE_URL/sso/callback"
  echo "Leave the Client ID empty to enter both in the setup wizard on the website after the start."
  ask ESI_ID "Client ID" ""
  if [[ -n "$ESI_ID" ]]; then
    read -r -s -p "Secret Key: " ESI_SECRET; echo
  fi
fi
[[ -z "$ESI_ID" || -n "$ESI_SECRET" ]] || die "--esi-client-id needs --esi-secret too"

echo
echo "About to set up EvE Conduit in $REPO:"
echo "  site:     $SITE_URL"
echo "  callback: $SITE_URL/sso/callback"
echo "  email:    $EMAIL"
echo "  EVE app:  ${ESI_ID:-entered in the setup wizard later}"
if [[ $SCHEME == https && "$DOMAIN" =~ ^[0-9.]+$ ]]; then
  echo "  No domain: Let's Encrypt issues an IP certificate, valid six days and renewed by Caddy. The address"
  echo "  must not change, and port 80 or 443 must be reachable from the internet."
fi
if [[ $ASSUME_YES -eq 0 ]]; then
  read -r -p "Continue? [y/N] " answer
  [[ "$answer" =~ ^[Yy]$ ]] || exit 1
fi

# --- ports -------------------------------------------------------------------------------------------------------
if command -v ss >/dev/null; then
  # grep exits 1 when nothing listens there, which is the good case: don't let set -e take it as a failure.
  busy=$(ss -Hltn 2>/dev/null | awk '{print $4}' | grep -oE ':(80|443)$' | tr -d : | sort -u | tr '\n' ' ' || true)
  if [[ -n "$busy" ]]; then
    echo
    echo "Warning: something on this machine already listens on port(s) $busy. Caddy needs 80 and 443; stop that"
    echo "program (often apache2 or nginx) or the web container won't start."
  fi
fi

# --- .env ----------------------------------------------------------------------------------------------------------
step "Writing .env"
SECRET_KEY=$(random_token 64 60)
DB_PASSWORD=$(random_token 32 32)
TOKEN_KEY=$(openssl rand -base64 32 | tr '+/' '-_')
umask 077
{
  cat <<ENV
# Written by deploy/docker/install.sh on $(date -u +%Y-%m-%d). Apply changes with: docker compose up -d
# --- Required -----------------------------------------------------------------
CONDUIT_SECRET_KEY=$SECRET_KEY
POSTGRES_PASSWORD=$DB_PASSWORD

# Public address of the site. CONDUIT_DOMAIN makes Caddy get an HTTPS certificate; empty means plain HTTP on port 80.
CONDUIT_DOMAIN=$DOMAIN
CONDUIT_SITE_URL=$SITE_URL
CONDUIT_ALLOWED_HOSTS=${HOST%%:*}

# The EVE application (callback URL: $SITE_URL/sso/callback). Empty: the setup wizard on the website asks for it.
# Set here, it takes precedence over what was entered on the website.
ESI_CLIENT_ID=$ESI_ID
ESI_SECRET_KEY=$ESI_SECRET

# CCP asks every ESI app to identify itself.
ESI_USER_AGENT_CONTACT=$EMAIL

# Key for encrypting stored EVE logins (Fernet). Back this file up: without it the database is useless.
CONDUIT_TOKEN_KEY=$TOKEN_KEY

ENV
  # Keep the documented optional settings, commented out, from .env.example.
  sed -n '/^# --- Optional/,$p' .env.example
} > .env
umask 022
note "wrote $REPO/.env with fresh secrets (readable by you only)"

if [[ $START -eq 0 ]]; then
  echo
  echo "Not starting (--no-start). When ready: docker compose up -d --build, then docker compose logs web | grep \"setup code\""
  exit 0
fi

# --- build and start ------------------------------------------------------------------------------------------------
step "Building and starting (the first build takes 5 to 10 minutes)"
docker compose up -d --build

step "Waiting for the setup code"
code=""
for _ in $(seq 1 60); do
  code=$(docker compose logs web 2>/dev/null | sed -n 's/.*setup code: \([A-Za-z0-9_-]*\).*/\1/p' | tail -1)
  [[ -n "$code" ]] && break
  if docker compose ps --status exited 2>/dev/null | grep -q .; then
    echo "A container exited. Its log:"
    docker compose ps --status exited --format '{{.Service}}' | head -1 | xargs -r docker compose logs --tail 30
    die "fix the cause and run: docker compose up -d"
  fi
  sleep 5
done
echo
docker compose ps
echo

if [[ -z "$code" ]]; then
  echo "The web container hasn't printed the setup code yet. Check with: docker compose logs web | grep \"setup code\""
else
  echo "================================================================"
  echo "  EvE Conduit is starting. One-time setup code: $code"
  echo "================================================================"
fi
cat <<DONE

Next steps:
  1. Create an EVE application at https://developers.eveonline.com/applications
     with callback URL: $SITE_URL/sso/callback   (select every scope)
  2. Open $SITE_URL. The setup wizard asks for its Client ID and Secret Key and the setup code above.
  3. Sign in with your main character: you become the administrator.

Day to day (in $REPO): docker compose ps | logs -f web | up -d --build (after git pull)
DONE
if [[ $SCHEME == https ]]; then
  echo "HTTPS: Caddy requests the certificate as soon as DNS points $DOMAIN at this server and port 80 is reachable."
  echo "Until then the browser warns about the certificate; docker compose logs caddy shows progress."
fi
