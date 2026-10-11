#!/bin/sh
set -e

# Plugins installed from Administration -> Plugins live on the shared volume (CONDUIT_PLUGINS_DIR): bring the
# venv there up to date with the list, then run the app with that venv's Python so they import.
PY=python
if [ -n "${CONDUIT_PLUGINS_DIR:-}" ]; then
  python -I -m conduit.plugins.docker_updater sync "$CONDUIT_PLUGINS_DIR" || true
  PY=$(python -I -m conduit.plugins.docker_updater python "$CONDUIT_PLUGINS_DIR")
fi

case "$1" in
  web)
    "$PY" manage.py migrate --noinput
    "$PY" manage.py collectstatic --noinput -v0
    "$PY" manage.py conduit_init
    if [ -n "${CONDUIT_PLUGINS_DIR:-}" ]; then python -I -m conduit.plugins.docker_updater finish "$CONDUIT_PLUGINS_DIR" || true; fi
    exec "$PY" -m gunicorn conduit.wsgi --bind 0.0.0.0:8000 --workers "${WEB_WORKERS:-3}" --access-logfile - --no-control-socket
    ;;
  worker)
    # Threads: a sync spends nearly all its time waiting on ESI, so many cheap threads beat a few processes.
    exec "$PY" -m celery -A conduit worker --loglevel INFO --queues default,sync --pool "${WORKER_POOL:-threads}" --concurrency "${WORKER_CONCURRENCY:-16}"
    ;;
  beat)
    exec "$PY" -m celery -A conduit beat --loglevel INFO --schedule /tmp/celerybeat-schedule
    ;;
  *)
    exec "$@"
    ;;
esac
