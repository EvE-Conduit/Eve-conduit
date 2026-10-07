from django.conf import settings
from django.db import models


class PluginState(models.Model):
    """Whether an installed plugin is switched on for this site."""

    plugin_id = models.CharField(max_length=40, primary_key=True)
    enabled = models.BooleanField(default=False)
    installed_version = models.CharField(max_length=40, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.plugin_id} ({'on' if self.enabled else 'off'})"


class PluginInstaller(models.Model):
    """The plugin catalog this site last fetched, and installs it asked the updater for. One row."""

    class Job(models.TextChoices):
        NONE = "none"
        REQUESTED = "requested"
        RUNNING = "running"
        SUCCEEDED = "succeeded"
        FAILED = "failed"

    catalog = models.JSONField(default=dict, blank=True)
    catalog_checked_at = models.DateTimeField(null=True, blank=True)
    catalog_error = models.CharField(max_length=300, blank=True)
    #: Packages (canonical names) that install new catalog versions by themselves.
    auto_update = models.JSONField(default=list, blank=True)
    #: {package: version} admins were already told is available.
    notified = models.JSONField(default=dict, blank=True)

    job_id = models.CharField(max_length=32, blank=True)
    job_state = models.CharField(max_length=12, choices=Job.choices, default=Job.NONE)
    job_actions = models.JSONField(default=list, blank=True)
    job_summary = models.CharField(max_length=500, blank=True)
    job_automatic = models.BooleanField(default=False)
    job_requested_at = models.DateTimeField(null=True, blank=True)
    job_requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    job_message = models.TextField(blank=True)

    @classmethod
    def load(cls) -> "PluginInstaller":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
