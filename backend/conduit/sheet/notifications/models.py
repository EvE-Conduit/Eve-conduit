from django.db import models


class Notification(models.Model):
    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="notifications")
    notification_id = models.BigIntegerField()
    type = models.CharField(max_length=80, db_index=True)
    sender_id = models.BigIntegerField()
    sender_type = models.CharField(max_length=20)
    timestamp = models.DateTimeField(db_index=True)
    is_read = models.BooleanField(default=False)
    text = models.TextField(blank=True)

    class Meta:
        unique_together = [("character", "notification_id")]
        ordering = ["-timestamp"]
