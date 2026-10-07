"""Keeps warnings and errors in the database so admins can read them in the web UI.

Configured in settings.LOGGING. Never raises, never recurses, and skips the noisy
"Not Found: /..." warnings Django logs for every 4xx response.
"""

import logging
import threading

SKIP_PREFIXES = ("django.db.backends", "evecsm.audit")
_local = threading.local()


class DatabaseLogHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        if record.name.startswith(SKIP_PREFIXES):
            return
        if record.name in ("django.request", "django.server") and record.levelno < logging.ERROR:
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
                message=record.getMessage()[:10_000],
                traceback=logging.Formatter().formatException(record.exc_info)[:30_000] if record.exc_info else "",
            )
        except Exception:
            pass  # no database (yet), a broken transaction, tests without db access...
        finally:
            _local.busy = False
