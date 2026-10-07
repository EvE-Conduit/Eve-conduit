#!/bin/sh
set -e

case "$1" in
  web)
    python manage.py migrate --noinput
    python manage.py conduit_init
    exec gunicorn conduit.wsgi --bind 0.0.0.0:8000 --workers "${WEB_WORKERS:-3}" --access-logfile - --no-control-socket
    ;;
  worker)
    exec celery -A conduit worker --loglevel INFO --concurrency "${WORKER_CONCURRENCY:-4}"
    ;;
  beat)
    exec celery -A conduit beat --loglevel INFO --schedule /tmp/celerybeat-schedule
    ;;
  *)
    exec "$@"
    ;;
esac
