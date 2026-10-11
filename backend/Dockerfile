# Build context is the repository root (see docker-compose.yml).
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# git: plugins installed from Administration may come from git URLs (CONDUIT_PLUGIN_URLS).
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

COPY backend/pyproject.toml backend/manage.py backend/README.md ./
COPY backend/conduit ./conduit
RUN pip install .

# Plugins: anything listed in requirements-plugins.txt (PyPI names, git URLs or paths relative to /app). They depend
# on "conduit" by name, and PyPI has an unrelated package called conduit: the constraint pins it to the one above.
COPY plugins ./plugins
COPY requirements-plugins.txt ./
RUN python -I -m conduit.plugins.installer constraints > /tmp/constraints.txt \
    && pip install -c /tmp/constraints.txt -r requirements-plugins.txt && rm /tmp/constraints.txt

RUN CONDUIT_SECRET_KEY=build python manage.py collectstatic --noinput -v0

COPY backend/docker-entrypoint.sh /usr/local/bin/conduit
# /srv/seat-import and /srv/plugins: owned by conduit so the shared volumes mounted there (docker-compose.yml) start
# writable. staticfiles too: the web container collects plugins' static files again after installing plugins.
RUN chmod +x /usr/local/bin/conduit && useradd --system --uid 1000 conduit \
    && mkdir -p /srv/seat-import /srv/plugins && chown -R conduit /srv/seat-import /srv/plugins /app/staticfiles
USER conduit

EXPOSE 8000
ENTRYPOINT ["conduit"]
CMD ["web"]
