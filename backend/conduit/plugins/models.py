from django.db import models


class PluginState(models.Model):
    """Whether an installed plugin is switched on for this site."""

    plugin_id = models.CharField(max_length=40, primary_key=True)
    enabled = models.BooleanField(default=False)
    installed_version = models.CharField(max_length=40, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.plugin_id} ({'on' if self.enabled else 'off'})"
