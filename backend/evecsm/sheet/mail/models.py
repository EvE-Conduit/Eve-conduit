from django.db import models


class MailLabel(models.Model):
    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="mail_labels")
    label_id = models.IntegerField()
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7, blank=True)
    unread = models.IntegerField(default=0)

    class Meta:
        unique_together = [("character", "label_id")]


class Mail(models.Model):
    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="mail")
    mail_id = models.BigIntegerField()
    sender_id = models.BigIntegerField(null=True)
    subject = models.CharField(max_length=255, blank=True)
    timestamp = models.DateTimeField(db_index=True)
    is_read = models.BooleanField(default=False)
    labels = models.JSONField(default=list)
    recipients = models.JSONField(default=list)  # [{"recipient_id", "recipient_type"}]
    body = models.TextField(blank=True)
    body_fetched = models.BooleanField(default=False)

    class Meta:
        unique_together = [("character", "mail_id")]
        ordering = ["-timestamp"]
