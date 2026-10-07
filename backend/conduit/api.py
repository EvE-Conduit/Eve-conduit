"""Root of the JSON API: core routers plus one router per installed plugin."""

import importlib
import logging

from ninja import NinjaAPI
from ninja.security import django_auth

from conduit import __version__
from conduit.access.api import router as admin_access_router
from conduit.access.leader_api import router as group_leader_router
from conduit.accounts.api import router as me_router
from conduit.audit.api import router as admin_logs_router
from conduit.corp.api import router as corp_router
from conduit.esi.api import router as admin_esi_router
from conduit.events.api import router as admin_events_router
from conduit.external.admin_api import router as admin_external_router
from conduit.plugins import registry
from conduit.plugins.api import router as admin_modules_router
from conduit.notify.api import router as notify_router
from conduit.search.api import router as search_router
from conduit.site.api import admin_router as admin_site_router
from conduit.site.health import router as admin_health_router
from conduit.site.api import router as core_router
from conduit.site.api import setup_router
from conduit.sheet.api import me_router as sheet_me_router
from conduit.sheet.api import router as sheet_router

log = logging.getLogger(__name__)

api = NinjaAPI(title="EvE Conduit API", version=__version__, urls_namespace="api")

api.add_router("/core", core_router)
api.add_router("", search_router, auth=django_auth)
api.add_router("/setup", setup_router)
api.add_router("/me", me_router, auth=django_auth)
api.add_router("/me", sheet_me_router, auth=django_auth)
api.add_router("/me", notify_router, auth=django_auth)
api.add_router("/characters", sheet_router, auth=django_auth)
api.add_router("/groups", group_leader_router, auth=django_auth)
api.add_router("/corporations", corp_router, auth=django_auth)
api.add_router("/admin", admin_site_router, auth=django_auth)
api.add_router("/admin", admin_access_router, auth=django_auth)
api.add_router("/admin", admin_modules_router, auth=django_auth)
api.add_router("/admin", admin_logs_router, auth=django_auth)
api.add_router("/admin", admin_esi_router, auth=django_auth)
api.add_router("/admin", admin_external_router, auth=django_auth)
api.add_router("/admin", admin_events_router, auth=django_auth)
api.add_router("/admin", admin_health_router, auth=django_auth)

for plugin_id, plugin in registry.installed().items():
    if not plugin.api:
        continue
    try:
        path, _, attr = plugin.api.partition(":")
        api.add_router(f"/p/{plugin_id}", getattr(importlib.import_module(path), attr), auth=django_auth)
    except Exception:
        log.exception("Could not mount the API of plugin %s", plugin_id)
