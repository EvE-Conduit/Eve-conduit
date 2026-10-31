from django.conf import settings
from django.db import models


class TicketSettings(models.Model):
    """Where ticket channels go and which staff see them. One row."""

    #: The Discord category new channels are put in; empty puts them at the top of the server.
    category_id = models.CharField(max_length=32, blank=True)
    #: A Discord role that can see and answer every ticket; empty means only the two people in it.
    staff_role_id = models.CharField(max_length=32, blank=True)

    class Meta:
        verbose_name_plural = "Ticket settings"

    @classmethod
    def load(cls) -> "TicketSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Ticket(models.Model):
    """Whoever opened it reaching the member they picked: a private Discord channel, an EVE mail or both."""

    DISCORD, MAIL, BOTH = "discord", "mail", "both"
    #: The transcript: nothing to save (no channel, or still open), being saved, saved, or the channel went first.
    ARCHIVE_NONE, ARCHIVE_PENDING, ARCHIVE_DONE, ARCHIVE_LOST = "", "pending", "done", "lost"
    VIA_CHOICES = ((DISCORD, "Discord"), (MAIL, "EVE mail"), (BOTH, "Discord and EVE mail"))

    via = models.CharField(max_length=10, choices=VIA_CHOICES, default=DISCORD)
    subject = models.CharField(max_length=100)
    #: Names and ids are kept as they were, so the list still reads properly once an account is gone or unlinked.
    opened_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="+")
    opened_by_name = models.CharField(max_length=100)
    target = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="+")
    target_name = models.CharField(max_length=100)
    target_discord_id = models.CharField(max_length=32, blank=True)
    guild_id = models.CharField(max_length=32, blank=True)
    #: Empty for a mail-only ticket, and for the moment between reserving a ticket and Discord making its channel.
    channel_id = models.CharField(max_length=32, blank=True)
    #: What the mail said. A channel's messages are in the transcript instead.
    message = models.TextField(blank=True)
    archive_state = models.CharField(max_length=10, blank=True, default=ARCHIVE_NONE)
    #: Why the transcript isn't finished; it's tried again until it is.
    archive_error = models.CharField(max_length=300, blank=True)
    mail_id = models.BigIntegerField(null=True, blank=True)
    #: Why the mail of a "both" ticket didn't go; its channel is still there. Empty otherwise.
    mail_error = models.CharField(max_length=300, blank=True)
    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    closed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    #: The channel no longer exists: removed after its transcript was saved, or found missing on Discord.
    channel_gone = models.BooleanField(default=False)

    class Meta:
        ordering = ["-opened_at"]
        constraints = [
            models.UniqueConstraint(fields=["opened_by", "target"], condition=models.Q(closed_at__isnull=True),
                                    name="tickets_one_open_per_pair"),
        ]
        permissions = [
            ("open_tickets", "Can open tickets with members and see all tickets"),
            ("manage_tickets", "Can set up Discord tickets"),
        ]

    def __str__(self):
        return self.subject


class TicketMessage(models.Model):
    """One message of a ticket's channel, copied from Discord when it closed."""

    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name="messages")
    message_id = models.CharField(max_length=32)
    author_id = models.CharField(max_length=32)
    #: Their main character if they've linked Discord, otherwise their Discord name.
    author_name = models.CharField(max_length=100)
    is_bot = models.BooleanField(default=False)
    content = models.TextField(blank=True)
    #: ``[{"title", "description"}]``
    embeds = models.JSONField(default=list, blank=True)
    sent_at = models.DateTimeField()
    edited_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["sent_at", "pk"]
        constraints = [models.UniqueConstraint(fields=["ticket", "message_id"], name="tickets_unique_message")]


class TicketAttachment(models.Model):
    """A file attached to a message. Kept in the database, the one place every install backs up."""

    SAVED, TOO_BIG, UNAVAILABLE = "saved", "too_big", "unavailable"

    message = models.ForeignKey(TicketMessage, on_delete=models.CASCADE, related_name="files")
    attachment_id = models.CharField(max_length=32)
    name = models.CharField(max_length=255)
    #: As Discord reported it, so anyone could have chosen it. See ``services.serve_type``.
    content_type = models.CharField(max_length=100, blank=True)
    size = models.BigIntegerField(default=0)
    state = models.CharField(max_length=12, default=SAVED)
    content = models.BinaryField(null=True, blank=True)

    class Meta:
        ordering = ["pk"]
        constraints = [models.UniqueConstraint(fields=["message", "attachment_id"], name="tickets_unique_attachment")]
