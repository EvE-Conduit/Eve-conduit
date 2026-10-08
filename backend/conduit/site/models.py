import secrets

from django.conf import settings
from django.db import models


class SiteSettings(models.Model):
    """Per-install branding and first-run setup state. There is only ever one row."""

    name = models.CharField(max_length=60, default="EvE Conduit")
    tagline = models.CharField(max_length=120, blank=True)
    accent = models.CharField(max_length=7, default="#22d3ee")
    logo_url = models.URLField(blank=True)
    setup_completed = models.BooleanField(default=False)
    # One-time code that lets the first person claim admin. Shown in the server logs.
    setup_token = models.CharField(max_length=64, blank=True)
    # The super admin: whoever claimed the site with the setup code. Always an administrator; nobody can remove them.
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    # While on, only people who can manage the site get in; everyone else sees the message.
    maintenance_mode = models.BooleanField(default=False)
    maintenance_message = models.CharField(max_length=300, blank=True)
    # Where people land after signing in, e.g. a plugin's page ("/p/news"). Empty means the dashboard.
    start_page = models.CharField(max_length=200, blank=True, default="/home")
    # The landing page at /home (see landing.py). Empty means the built-in default.
    landing = models.JSONField(default=dict, blank=True)
    # Extra sidebar links admins add, e.g. the alliance wiki or killboard: [{label, url, icon}].
    nav_links = models.JSONField(default=list, blank=True)
    nav_links_title = models.CharField(max_length=40, default="Links")

    class Meta:
        verbose_name_plural = "site settings"
        permissions = [
            ("manage_site", "Can change site settings"),
            ("manage_access", "Can manage states and groups"),
            ("manage_plugins", "Can enable and disable plugins"),
            ("view_members", "Can see the member list"),
            ("manage_api", "Can manage API keys and switch APIs on and off"),
            ("view_logs", "Can view the audit, API request and service logs"),
            ("view_health", "Can see server health (workers, queues, ESI)"),
            ("impersonate_users", "Can sign in as another user to help them"),
        ]

    def __str__(self):
        return self.name

    @classmethod
    def load(cls) -> "SiteSettings":
        obj, created = cls.objects.get_or_create(pk=1)
        if not obj.setup_completed and not obj.setup_token:
            obj.setup_token = secrets.token_urlsafe(18)
            obj.save(update_fields=["setup_token"])
        return obj
