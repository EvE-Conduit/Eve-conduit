# Build context is the repository root (see docker-compose.yml).
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY backend/pyproject.toml backend/manage.py backend/README.md ./
COPY backend/evecsm ./evecsm
RUN pip install .

# Modules: anything listed in requirements-modules.txt (PyPI names, git URLs or paths relative to /app).
COPY modules ./modules
COPY requirements-modules.txt ./
RUN pip install -r requirements-modules.txt

RUN EVECSM_SECRET_KEY=build python manage.py collectstatic --noinput -v0

COPY backend/docker-entrypoint.sh /usr/local/bin/evecsm
RUN chmod +x /usr/local/bin/evecsm && useradd --system --uid 1000 evecsm
USER evecsm

EXPOSE 8000
ENTRYPOINT ["evecsm"]
CMD ["web"]
