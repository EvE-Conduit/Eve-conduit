#!/bin/sh
set -e

case "$1" in
  web)
    python manage.py migrate --noinput
    python manage.py conduit_init
    exec gunicorn conduit.wsgi --bind 0.0.0.0:8000 --workers "${WEB_WORKERS:-3}" --access-logfile - --no-control-socket
    ;;
  worker)
    # Threads: a sync spends nearly all its time waiting on ESI, so many cheap threads beat a few processes.
    exec celery -A conduit worker --loglevel INFO --queues default,sync --pool "${WORKER_POOL:-threads}" --concurrency "${WORKER_CONCURRENCY:-16}"
    ;;
  beat)
    exec celery -A conduit beat --loglevel INFO --schedule /tmp/celerybeat-schedule
    ;;
  *)
    exec "$@"
    ;;
esac
