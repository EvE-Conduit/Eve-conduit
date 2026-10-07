from django.conf import settings
from django.db import models
from django.utils import timezone


class Announcement(models.Model):
    """News for members. Everyone sees it unless it's limited to some states or groups."""

    class Tone(models.TextChoices):
        INFO = "info", "News"
        IMPORTANT = "important", "Important"
        URGENT = "urgent", "Urgent"

    title = models.CharField(max_length=200)
    #: Light Markdown: paragraphs, **bold**, *italic*, `code`, links, lists, headings and quotes.
    body = models.TextField(blank=True)
    tone = models.CharField(max_length=10, choices=Tone.choices, default=Tone.INFO)
    pinned = models.BooleanField(default=False)
    #: Who sees it: users in any of these states or groups. Both empty means everyone.
    states = models.ManyToManyField("access.State", blank=True, related_name="+")
    groups = models.ManyToManyField("auth.Group", blank=True, related_name="+")
    publish_at = models.DateTimeField(default=timezone.now, db_index=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    #: Send a notification to everyone who can see it once it's published.
    notify = models.BooleanField(default=True)
    #: When it was announced (notifications and the webhook event); empty until it's published.
    announced_at = models.DateTimeField(null=True, blank=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    edited_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")

    class Meta:
        ordering = ["-pinned", "-publish_at"]
        permissions = [("post_announcements", "Can write, edit and delete announcements")]

    def __str__(self):
        return self.title


class AnnouncementRead(models.Model):
    """Someone has seen an announcement, so it no longer counts as new for them."""

    announcement = models.ForeignKey(Announcement, on_delete=models.CASCADE, related_name="reads")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("announcement", "user")]
