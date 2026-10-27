from django.conf import settings
from django.db import models


class Reminder(models.Model):
    """One reminder sent about one extractor program. The program's expiry is part of the key, so restarting it (a
    new expiry) is reminded again, and each program gets each kind of reminder once."""

    class Kind(models.TextChoices):
        SOON = "soon", "About to expire"
        EXPIRED = "expired", "Expired"

    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="+")
    planet_id = models.IntegerField()
    pin_id = models.BigIntegerField()
    expiry = models.DateTimeField(db_index=True)
    kind = models.CharField(max_length=8, choices=Kind.choices)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["character", "planet_id", "pin_id", "expiry", "kind"], name="pi_reminder_once")]
        permissions = [("view_corp_pi", "Can see the PI of every character their character sheet access covers")]


class Digest(models.Model):
    """When a member last got the daily digest, so a second run on the same day sends nothing."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="pi_digest")
    sent_on = models.DateField()
