#!/bin/sh
set -e

case "$1" in
  web)
    python manage.py migrate --noinput
    python manage.py evecsm_init
    exec gunicorn evecsm.wsgi --bind 0.0.0.0:8000 --workers "${WEB_WORKERS:-3}" --access-logfile - --no-control-socket
    ;;
  worker)
    exec celery -A evecsm worker --loglevel INFO --concurrency "${WORKER_CONCURRENCY:-4}"
    ;;
  beat)
    exec celery -A evecsm beat --loglevel INFO --schedule /tmp/celerybeat-schedule
    ;;
  *)
    exec "$@"
    ;;
esac
