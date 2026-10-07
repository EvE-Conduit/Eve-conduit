"""EvE Conduit settings. Everything an operator changes comes from environment variables."""

import os
from pathlib import Path

import dj_database_url
from celery.schedules import crontab

from conduit.plugins import registry

BASE_DIR = Path(__file__).resolve().parent.parent


def env(name, default=None):
    return os.environ.get(name, default)


def env_bool(name, default=False):
    return env(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


def env_list(name, default=""):
    return [v.strip() for v in env(name, default).split(",") if v.strip()]


DEBUG = env_bool("CONDUIT_DEBUG")
SECRET_KEY = env("CONDUIT_SECRET_KEY") or ("dev-insecure-key" if DEBUG else None)
if not SECRET_KEY:
    raise RuntimeError("CONDUIT_SECRET_KEY must be set (or CONDUIT_DEBUG=true for development)")

# Public URL of the site, e.g. https://auth.example.com. Used for the SSO callback.
SITE_URL = env("CONDUIT_SITE_URL", "http://localhost:5173").rstrip("/")
ALLOWED_HOSTS = env_list("CONDUIT_ALLOWED_HOSTS", "localhost,127.0.0.1")
CSRF_TRUSTED_ORIGINS = env_list("CONDUIT_CSRF_TRUSTED_ORIGINS", SITE_URL)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "conduit.sde",
    "conduit.eve",
    "conduit.accounts",
    "conduit.access",
    "conduit.esi",
    "conduit.plugins",
    "conduit.site",
    "conduit.audit",
    "conduit.external",
    "conduit.events",
    "conduit.notify",
    "conduit.updates",
    "conduit.sheet",
    "conduit.sheet.overview",
    "conduit.sheet.skills",
    "conduit.sheet.wallet",
    "conduit.sheet.assets",
    "conduit.sheet.blueprints",
    "conduit.sheet.industry",
    "conduit.sheet.research",
    "conduit.sheet.mining",
    "conduit.sheet.planets",
    "conduit.sheet.market",
    "conduit.sheet.contracts",
    "conduit.sheet.mail",
    "conduit.sheet.notifications",
    "conduit.sheet.calendar",
    "conduit.sheet.contacts",
    "conduit.sheet.standings",
    "conduit.sheet.loyalty",
    "conduit.sheet.fittings",
    "conduit.sheet.killmails",
    "conduit.sheet.intel",
    "conduit.corp",
    *registry.django_apps(),
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "conduit.site.ratelimit.RateLimitMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "conduit.site.middleware.ImpersonationGuardMiddleware",
    "conduit.site.middleware.MaintenanceMiddleware",
    "conduit.plugins.middleware.DisabledModuleMiddleware",
    "conduit.external.middleware.ApiRequestLogMiddleware",
]

ROOT_URLCONF = "conduit.urls"
WSGI_APPLICATION = "conduit.wsgi.application"

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
AUTHENTICATION_BACKENDS = ["conduit.access.backends.StatePermissionBackend"]
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
STATIC_ROOT = Path(env("CONDUIT_STATIC_ROOT", BASE_DIR / "staticfiles"))
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
CONDUIT_TOKEN_KEY = env("CONDUIT_TOKEN_KEY", "")
# Earlier keys, comma separated, still accepted for decrypting while `manage.py rotate_token_key` re-encrypts.
CONDUIT_TOKEN_KEY_PREVIOUS = env_list("CONDUIT_TOKEN_KEY_PREVIOUS")

# --- Celery ------------------------------------------------------------------
CELERY_BROKER_URL = REDIS_URL or "memory://"
CELERY_RESULT_BACKEND = None
CELERY_TASK_ALWAYS_EAGER = not REDIS_URL
CELERY_TASK_DEFAULT_QUEUE = "default"
CELERY_TASK_ROUTES = {"conduit.*": {"queue": "default"}}
CELERY_BEAT_SCHEDULE = {
    "core:update-affiliations": {
        "task": "conduit.eve.tasks.update_affiliations",
        "schedule": crontab(minute="*/30"),
    },
    "core:character-syncs": {"task": "conduit.sheet.tasks.schedule_syncs", "schedule": 120.0},
    "core:corporation-syncs": {"task": "conduit.corp.tasks.schedule_syncs", "schedule": 300.0},
    "core:market-prices": {"task": "conduit.eve.tasks.update_market_prices", "schedule": crontab(minute=17)},
    # New game builds land around 11:00 UTC downtime; check a little after.
    "core:sde": {"task": "conduit.sde.tasks.update_sde", "schedule": crontab(hour=12, minute=5)},
    "core:update-check": {"task": "conduit.updates.tasks.check_for_updates", "schedule": crontab(hour=12, minute=23)},
    "core:update-result": {"task": "conduit.updates.tasks.collect_install_result", "schedule": 120.0},
    "core:plugin-updates": {"task": "conduit.plugins.tasks.check_plugin_updates", "schedule": crontab(hour=12, minute=41)},
    "core:plugin-result": {"task": "conduit.plugins.tasks.collect_plugin_result", "schedule": 120.0},
    "core:heartbeat": {"task": "conduit.site.tasks.heartbeat", "schedule": 60.0},
    "core:purge-logs": {"task": "conduit.audit.tasks.purge_logs", "schedule": crontab(hour=3, minute=40)},
    "core:smart-groups": {"task": "conduit.access.tasks.update_smart_groups", "schedule": crontab(minute="*/15")},
    "core:compliance": {"task": "conduit.access.tasks.update_compliance", "schedule": crontab(minute="7,37")},
    **registry.beat_schedule(),
}

NINJA_PAGINATION_PER_PAGE = 50

# Warnings and errors are also kept in the database for Administration > Logs (CONDUIT_SERVICE_LOG_DB=false: don't).
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
        "database": {"class": "conduit.audit.logging.DatabaseLogHandler", "level": "WARNING"},
    },
    "root": {
        "handlers": ["console", "database"] if env_bool("CONDUIT_SERVICE_LOG_DB", True) else ["console"],
        "level": env("CONDUIT_LOG_LEVEL", "INFO"),
    },
}

# --- Logs and the external API ---------------------------------------------------
# Days to keep each log; 0 keeps it forever. Purged nightly.
CONDUIT_AUDIT_LOG_DAYS = int(env("CONDUIT_AUDIT_LOG_DAYS", "365"))
CONDUIT_API_LOG_DAYS = int(env("CONDUIT_API_LOG_DAYS", "90"))
CONDUIT_SERVICE_LOG_DAYS = int(env("CONDUIT_SERVICE_LOG_DAYS", "30"))
CONDUIT_ESI_LOG_DAYS = int(env("CONDUIT_ESI_LOG_DAYS", "7"))
# Which ESI calls to record: all, errors (anything but 200/304) or off.
CONDUIT_ESI_LOG = env("CONDUIT_ESI_LOG", "all").strip().lower()
# --- Updates ----------------------------------------------------------------------------------
# How this copy was installed: windows, baremetal, docker or dev. Only windows and baremetal installs
# can download and install releases (through their privileged updater); the others are told how to update.
CONDUIT_INSTALL_KIND = env("CONDUIT_INSTALL_KIND", "dev").strip().lower()
# Where downloaded releases and the updater's request/result files live (writable by the app).
CONDUIT_UPDATES_DIR = env("CONDUIT_UPDATES_DIR", str(BASE_DIR / "updates"))
# GitHub repository releases come from, and whether to look for them daily (notify only).
CONDUIT_UPDATE_REPO = env("CONDUIT_UPDATE_REPO", "EvE-Conduit/Eve-conduit")
CONDUIT_UPDATE_CHECK = env_bool("CONDUIT_UPDATE_CHECK", True)
CONDUIT_UPDATE_PRERELEASES = env_bool("CONDUIT_UPDATE_PRERELEASES")
# Signed catalog of official plugins (from github.com/EvE-Conduit/plugins), offered under Administration > Plugins.
# Published by this repository's "Plugin catalog" workflow, which holds the signing key.
CONDUIT_PLUGIN_CATALOG_URL = env(
    "CONDUIT_PLUGIN_CATALOG_URL",
    "https://github.com/EvE-Conduit/Eve-conduit/releases/download/plugin-catalog/catalog.json")
# Let administrators install plugins from any git URL over HTTPS. A plugin runs with the site's access to the
# server and database, so only the server owner can turn this on (the updater reads it from the config file).
CONDUIT_PLUGIN_URLS = env_bool("CONDUIT_PLUGIN_URLS")
# The updater's list of plugins installed from Administration (read-only for the site).
CONDUIT_PLUGIN_SITE_FILE = env(
    "CONDUIT_PLUGIN_SITE_FILE", "/etc/conduit/plugins-site.txt" if CONDUIT_INSTALL_KIND == "baremetal" else "")

# Per-IP limits on EVE login, the setup code and failed API-key attempts (see conduit/site/ratelimit.py).
CONDUIT_RATE_LIMITS = env_bool("CONDUIT_RATE_LIMITS", True)
# The Django back-office at /django-admin/ (superusers only). false removes it entirely.
CONDUIT_DJANGO_ADMIN = env_bool("CONDUIT_DJANGO_ADMIN", True)
# Let webhooks post to private/internal addresses (off: only public internet hosts).
CONDUIT_WEBHOOK_ALLOW_PRIVATE = env_bool("CONDUIT_WEBHOOK_ALLOW_PRIVATE")
# Folder of the server's log files, readable under Administration > Logs (set by the Windows launcher).
CONDUIT_LOG_DIR = env("CONDUIT_LOG_DIR", "")
