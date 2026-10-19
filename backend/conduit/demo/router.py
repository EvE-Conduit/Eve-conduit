"""Send a demo request's queries to the demo database."""

from .state import active

#: Site-wide tables that stay in the real database even for demo requests: sign-in sessions (so everyone's own
#: sign-in is still there when demo mode ends), the branding and switches in the site settings, uploaded site
#: images, and which plugins are switched on. The demo middleware refuses every change, so demo visitors only read
#: them. Models by "app_label.model_name".
SHARED = {
    "sessions.session",
    "site.sitesettings",
    "site.siteimage",
    "plugins.pluginstate",
    "plugins.plugininstaller",
    "updates.updatestate",
}


def _db(model):
    if not active() or model._meta.label_lower in SHARED:
        return None
    return "demo"


class DemoRouter:
    def db_for_read(self, model, **hints):
        return _db(model)

    def db_for_write(self, model, **hints):
        return _db(model)

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        # The demo database is migrated only while it's built (conduit.demo.database), so makemigrations and
        # friends leave it alone the rest of the time.
        return db != "demo" or active()
