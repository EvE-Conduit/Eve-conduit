"""Keeps warnings and errors in the database so admins can read them in the web UI.

Configured in settings.LOGGING. Never raises, never recurses, and skips the noisy
"Not Found: /..." warnings Django logs for every 4xx response.

Every plugin gets its own log without doing anything: records from loggers under the plugin's package
(``logging.getLogger(__name__)``), or logged with ``extra={"plugin": "<id>"}``, are tagged with the plugin's id
and kept from CONDUIT_PLUGIN_LOG_LEVEL (INFO) up, so its normal activity shows too, not just its problems.
"""

import logging
import threading

SKIP_PREFIXES = ("django.db.backends", "conduit.audit")
_local = threading.local()


class DatabaseLogHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        if record.name.startswith(SKIP_PREFIXES):
            return
        if record.name in ("django.request", "django.server") and record.levelno < logging.ERROR:
            return
        plugin = getattr(record, "plugin", "") or _plugin_for(record.name)
        if record.levelno < (_plugin_level() if plugin else logging.WARNING):
            return
        if getattr(_local, "busy", False):
            return
        _local.busy = True
        try:
            from django.apps import apps

            if not apps.ready:
                return
            from .models import ServiceLog

            ServiceLog.objects.create(
                level=record.levelname[:10],
                logger=record.name[:200],
                plugin=plugin[:40],
                message=record.getMessage()[:10_000],
                traceback=logging.Formatter().formatException(record.exc_info)[:30_000] if record.exc_info else "",
            )
        except Exception:
            pass  # no database (yet), a broken transaction, tests without db access...
        finally:
            _local.busy = False


def _plugin_for(name: str) -> str:
    if name.startswith(("django.", "celery.", "conduit.")):
        return ""
    from conduit.plugins.registry import plugin_for_logger

    return plugin_for_logger(name)


def _plugin_level() -> int:
    from django.conf import settings

    level = logging.getLevelName(str(getattr(settings, "CONDUIT_PLUGIN_LOG_LEVEL", "INFO")).upper())
    return level if isinstance(level, int) else logging.INFO
