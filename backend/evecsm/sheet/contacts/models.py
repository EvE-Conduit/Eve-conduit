from django.db import models


class Contact(models.Model):
    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="contacts")
    contact_id = models.BigIntegerField()
    contact_type = models.CharField(max_length=20)
    standing = models.FloatField()
    is_blocked = models.BooleanField(default=False)
    is_watched = models.BooleanField(default=False)
    labels = models.JSONField(default=list)  # [label name]

    class Meta:
        unique_together = [("character", "contact_id")]
