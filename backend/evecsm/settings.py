"""EVECSM settings. Everything an operator changes comes from environment variables."""

import os
from pathlib import Path

import dj_database_url
from celery.schedules import crontab

from evecsm.modules import registry

BASE_DIR = Path(__file__).resolve().parent.parent


def env(name, default=None):
    return os.environ.get(name, default)


def env_bool(name, default=False):
    return env(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


def env_list(name, default=""):
    return [v.strip() for v in env(name, default).split(",") if v.strip()]


DEBUG = env_bool("EVECSM_DEBUG")
SECRET_KEY = env("EVECSM_SECRET_KEY") or ("dev-insecure-key" if DEBUG else None)
if not SECRET_KEY:
    raise RuntimeError("EVECSM_SECRET_KEY must be set (or EVECSM_DEBUG=true for development)")

# Public URL of the site, e.g. https://auth.example.com. Used for the SSO callback.
SITE_URL = env("EVECSM_SITE_URL", "http://localhost:5173").rstrip("/")
ALLOWED_HOSTS = env_list("EVECSM_ALLOWED_HOSTS", "localhost,127.0.0.1")
CSRF_TRUSTED_ORIGINS = env_list("EVECSM_CSRF_TRUSTED_ORIGINS", SITE_URL)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "evecsm.sde",
    "evecsm.eve",
    "evecsm.accounts",
    "evecsm.access",
    "evecsm.esi",
    "evecsm.modules",
    "evecsm.site",
    "evecsm.audit",
    "evecsm.external",
    "evecsm.events",
    "evecsm.notify",
    "evecsm.sheet",
    "evecsm.sheet.overview",
    "evecsm.sheet.skills",
    "evecsm.sheet.wallet",
    "evecsm.sheet.assets",
    "evecsm.sheet.blueprints",
    "evecsm.sheet.industry",
    "evecsm.sheet.research",
    "evecsm.sheet.mining",
    "evecsm.sheet.planets",
    "evecsm.sheet.market",
    "evecsm.sheet.contracts",
    "evecsm.sheet.mail",
    "evecsm.sheet.notifications",
    "evecsm.sheet.calendar",
    "evecsm.sheet.contacts",
    "evecsm.sheet.standings",
    "evecsm.sheet.loyalty",
    "evecsm.sheet.fittings",
    "evecsm.sheet.killmails",
    "evecsm.sheet.intel",
    "evecsm.corp",
    *registry.django_apps(),
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "evecsm.site.ratelimit.RateLimitMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "evecsm.site.middleware.ImpersonationGuardMiddleware",
    "evecsm.site.middleware.MaintenanceMiddleware",
    "evecsm.modules.middleware.DisabledModuleMiddleware",
    "evecsm.external.middleware.ApiRequestLogMiddleware",
]

ROOT_URLCONF = "evecsm.urls"
WSGI_APPLICATION = "evecsm.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# postgres://user:pass@host/db (recommended), mysql://... for MariaDB/MySQL, or sqlite:///path for development.
DATABASES = {
    "default": dj_database_url.parse(
        env("DATABASE_URL", f"sqlite:///{BASE_DIR / 'db.sqlite3'}"), conn_max_age=60, conn_health_checks=True
    )
}
if DATABASES["default"]["ENGINE"] == "django.db.backends.mysql":
    # Full Unicode (character names, mail) and strict mode, as Django recommends for MariaDB/MySQL.
    DATABASES["default"].setdefault("OPTIONS", {}).update(
        {"charset": "utf8mb4", "init_command": "SET sql_mode='STRICT_TRANS_TABLES'"}
    )
    DATABASES["default"]["TEST"] = {"CHARSET": "utf8mb4", "COLLATION": "utf8mb4_unicode_ci"}

REDIS_URL = env("REDIS_URL")
if REDIS_URL:
    CACHES = {"default": {"BACKEND": "django.core.cache.backends.redis.RedisCache", "LOCATION": REDIS_URL}}
else:
    CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}

AUTH_USER_MODEL = "accounts.User"
AUTHENTICATION_BACKENDS = ["evecsm.access.backends.StatePermissionBackend"]
LOGIN_URL = "/login"

SESSION_COOKIE_AGE = 60 * 60 * 24 * 30
SESSION_COOKIE_SECURE = SITE_URL.startswith("https://")
CSRF_COOKIE_SECURE = SESSION_COOKIE_SECURE
SESSION_COOKIE_SAMESITE = "Lax"
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"  # EVE time
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = Path(env("EVECSM_STATIC_ROOT", BASE_DIR / "staticfiles"))
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
        if DEBUG
        else "whitenoise.storage.CompressedStaticFilesStorage"
    },
}
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- EVE SSO / ESI -----------------------------------------------------------
ESI_CLIENT_ID = env("ESI_CLIENT_ID", "")
ESI_SECRET_KEY = env("ESI_SECRET_KEY", "")
ESI_CALLBACK_URL = env("ESI_CALLBACK_URL", f"{SITE_URL}/sso/callback")
ESI_BASE_URL = env("ESI_BASE_URL", "https://esi.evetech.net")
# ESI behaviour is pinned to this date; bump it deliberately after testing.
ESI_COMPATIBILITY_DATE = env("ESI_COMPATIBILITY_DATE", "2026-08-18")
# CCP asks for contact details in the User-Agent (an email is strongly preferred).
ESI_USER_AGENT_CONTACT = env("ESI_USER_AGENT_CONTACT", "")
# Pause all ESI calls when fewer errors than this remain in the error window.
ESI_ERROR_LIMIT_THRESHOLD = int(env("ESI_ERROR_LIMIT_THRESHOLD", "10"))
ESI_LOGIN_SCOPES = ["publicData"]
# Scopes asked for at sign-in, space separated. Default: every scope EVE SSO offers. Each one must also be
# enabled on the EVE application, otherwise the EVE login page fails with invalid_scope.
ESI_SCOPES = env("ESI_SCOPES", "").split()

# Key for encrypting stored SSO tokens. Falls back to one derived from SECRET_KEY.
EVECSM_TOKEN_KEY = env("EVECSM_TOKEN_KEY", "")
# Earlier keys, comma separated, still accepted for decrypting while `manage.py rotate_token_key` re-encrypts.
EVECSM_TOKEN_KEY_PREVIOUS = env_list("EVECSM_TOKEN_KEY_PREVIOUS")

# --- Celery ------------------------------------------------------------------
CELERY_BROKER_URL = REDIS_URL or "memory://"
CELERY_RESULT_BACKEND = None
CELERY_TASK_ALWAYS_EAGER = not REDIS_URL
CELERY_TASK_DEFAULT_QUEUE = "default"
CELERY_TASK_ROUTES = {"evecsm.*": {"queue": "default"}}
CELERY_BEAT_SCHEDULE = {
    "core:update-affiliations": {
        "task": "evecsm.eve.tasks.update_affiliations",
        "schedule": crontab(minute="*/30"),
    },
    "core:character-syncs": {"task": "evecsm.sheet.tasks.schedule_syncs", "schedule": 120.0},
    "core:corporation-syncs": {"task": "evecsm.corp.tasks.schedule_syncs", "schedule": 300.0},
    "core:market-prices": {"task": "evecsm.eve.tasks.update_market_prices", "schedule": crontab(minute=17)},
    # New game builds land around 11:00 UTC downtime; check a little after.
    "core:sde": {"task": "evecsm.sde.tasks.update_sde", "schedule": crontab(hour=12, minute=5)},
    "core:heartbeat": {"task": "evecsm.site.tasks.heartbeat", "schedule": 60.0},
    "core:purge-logs": {"task": "evecsm.audit.tasks.purge_logs", "schedule": crontab(hour=3, minute=40)},
    "core:smart-groups": {"task": "evecsm.access.tasks.update_smart_groups", "schedule": crontab(minute="*/15")},
    "core:compliance": {"task": "evecsm.access.tasks.update_compliance", "schedule": crontab(minute="7,37")},
    **registry.beat_schedule(),
}

NINJA_PAGINATION_PER_PAGE = 50

# Warnings and errors are also kept in the database for Administration > Logs (EVECSM_SERVICE_LOG_DB=false: don't).
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
        "database": {"class": "evecsm.audit.logging.DatabaseLogHandler", "level": "WARNING"},
    },
    "root": {
        "handlers": ["console", "database"] if env_bool("EVECSM_SERVICE_LOG_DB", True) else ["console"],
        "level": env("EVECSM_LOG_LEVEL", "INFO"),
    },
}

# --- Logs and the external API ---------------------------------------------------
# Days to keep each log; 0 keeps it forever. Purged nightly.
EVECSM_AUDIT_LOG_DAYS = int(env("EVECSM_AUDIT_LOG_DAYS", "365"))
EVECSM_API_LOG_DAYS = int(env("EVECSM_API_LOG_DAYS", "90"))
EVECSM_SERVICE_LOG_DAYS = int(env("EVECSM_SERVICE_LOG_DAYS", "30"))
EVECSM_ESI_LOG_DAYS = int(env("EVECSM_ESI_LOG_DAYS", "7"))
# Which ESI calls to record: all, errors (anything but 200/304) or off.
EVECSM_ESI_LOG = env("EVECSM_ESI_LOG", "all").strip().lower()
# Per-IP limits on EVE login, the setup code and failed API-key attempts (see evecsm/site/ratelimit.py).
EVECSM_RATE_LIMITS = env_bool("EVECSM_RATE_LIMITS", True)
# The Django back-office at /django-admin/ (superusers only). false removes it entirely.
EVECSM_DJANGO_ADMIN = env_bool("EVECSM_DJANGO_ADMIN", True)
# Let webhooks post to private/internal addresses (off: only public internet hosts).
EVECSM_WEBHOOK_ALLOW_PRIVATE = env_bool("EVECSM_WEBHOOK_ALLOW_PRIVATE")
# Folder of the server's log files, readable under Administration > Logs (set by the Windows launcher).
EVECSM_LOG_DIR = env("EVECSM_LOG_DIR", "")
