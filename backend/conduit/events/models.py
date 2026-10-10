import secrets

from django.db import models
from django.utils import timezone


def new_secret() -> str:
    return secrets.token_urlsafe(24)


class Webhook(models.Model):
    """Sends chosen events to a URL: a Discord or Slack channel, or any service (signed JSON)."""

    class Kind(models.TextChoices):
        DISCORD = "discord"
        SLACK = "slack"
        JSON = "json"

    name = models.CharField(max_length=80)
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.JSON)
    url = models.URLField(max_length=500)
    #: Event names; empty means every event.
    events = models.JSONField(default=list, blank=True)
    #: For ``json`` hooks: requests carry ``X-Conduit-Signature: sha256=<hmac of the body>``.
    secret = models.CharField(max_length=64, default=new_secret)
    enabled = models.BooleanField(default=True)
    #: Discord only: who to ping. "" (nobody), "here", "everyone" or a role id.
    mention = models.CharField(max_length=32, blank=True, default="")
    #: Ping on every message, not only on events that ask for one (``ping`` in the payload).
    mention_always = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    last_status = models.IntegerField(null=True, blank=True)
    last_error = models.CharField(max_length=300, blank=True)
    last_delivery_at = models.DateTimeField(null=True, blank=True)
    failures = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def wants(self, event_name: str) -> bool:
        return self.enabled and (not self.events or event_name in self.events)


class WebhookDelivery(models.Model):
    webhook = models.ForeignKey(Webhook, on_delete=models.CASCADE, related_name="deliveries")
    at = models.DateTimeField(default=timezone.now, db_index=True)
    event = models.CharField(max_length=60)
    status = models.IntegerField(null=True)
    ok = models.BooleanField(default=False)
    error = models.CharField(max_length=300, blank=True)
    duration_ms = models.PositiveIntegerField(default=0)
    attempt = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ["-id"]
