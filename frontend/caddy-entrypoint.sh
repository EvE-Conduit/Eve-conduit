#!/bin/sh
# Starts Caddy for the Docker install. An IPv4 address as CONDUIT_DOMAIN (instead of a domain name) needs a
# different certificate setup, which the Caddyfile picks with CONDUIT_TLS.
if printf '%s' "$CONDUIT_DOMAIN" | grep -Eq '^[0-9]{1,3}(\.[0-9]{1,3}){3}$'; then
  export CONDUIT_TLS=ip
fi
exec "$@"
