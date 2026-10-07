from django.db import models
from django.utils import timezone


class EsiCall(models.Model):
    """One request EvE Conduit sent to ESI (or held back because of an error-limit or rate-limit pause).
    Answers from the local cache never reach ESI and aren't recorded."""

    class Outcome(models.TextChoices):
        OK = "ok"
        NOT_MODIFIED = "not_modified"  # 304: ETag matched, nothing new
        ERROR = "error"  # ESI answered 4xx/5xx
        RATE_LIMITED = "rate_limited"  # 429
        NETWORK = "network"  # no answer at all
        PAUSED = "paused"  # not sent: we were backing off

    at = models.DateTimeField(default=timezone.now, db_index=True)
    method = models.CharField(max_length=6)
    route = models.CharField(max_length=200, db_index=True)  # /characters/{n}/wallet
    path = models.CharField(max_length=300)
    query = models.CharField(max_length=300, blank=True)
    character_id = models.BigIntegerField(null=True, blank=True, db_index=True)
    source = models.CharField(max_length=80, blank=True, db_index=True)  # sheet:wallet, eve.update_affiliations...
    outcome = models.CharField(max_length=12, choices=Outcome.choices, db_index=True)
    status = models.PositiveSmallIntegerField(null=True, blank=True)
    duration_ms = models.PositiveIntegerField(default=0)
    error = models.CharField(max_length=300, blank=True)
    error_limit_remain = models.SmallIntegerField(null=True, blank=True)
    ratelimit_group = models.CharField(max_length=80, blank=True)
    ratelimit_remaining = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ["-id"]

    def __str__(self):
        return f"{self.method} {self.path} {self.status or self.outcome}"
