from django.conf import settings
from django.db import models
from django.utils import timezone


class Notification(models.Model):
    """A message to one user, shown under the bell in the top bar."""

    class Level(models.TextChoices):
        INFO = "info"
        SUCCESS = "success"
        WARNING = "warning"
        DANGER = "danger"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    level = models.CharField(max_length=10, choices=Level.choices, default=Level.INFO)
    #: Groups notifications for muting in preferences, e.g. "groups", "tokens", "m.timers".
    category = models.CharField(max_length=40, default="system")
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    #: Path inside the site (``/groups``) or an https:// URL.
    link = models.CharField(max_length=500, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    data = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-id"]
        indexes = [models.Index(fields=["user", "read_at"])]

    def __str__(self):
        return self.title
