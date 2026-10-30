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
    """A private Discord channel between whoever opened it and the member they picked."""

    subject = models.CharField(max_length=100)
    #: Names and ids are kept as they were, so the list still reads properly once an account is gone or unlinked.
    opened_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="+")
    opened_by_name = models.CharField(max_length=100)
    target = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="+")
    target_name = models.CharField(max_length=100)
    target_discord_id = models.CharField(max_length=32)
    guild_id = models.CharField(max_length=32)
    #: Empty only for the moment between reserving the ticket and Discord making its channel.
    channel_id = models.CharField(max_length=32, blank=True)
    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    closed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    #: The channel no longer exists: deleted from here, or found missing on Discord when closing.
    channel_gone = models.BooleanField(default=False)

    class Meta:
        ordering = ["-opened_at"]
        constraints = [
            models.UniqueConstraint(fields=["opened_by", "target"], condition=models.Q(closed_at__isnull=True),
                                    name="tickets_one_open_per_pair"),
        ]
        permissions = [
            ("open_tickets", "Can open Discord tickets with members and see all tickets"),
            ("manage_tickets", "Can set up Discord tickets and delete any closed ticket's channel"),
        ]

    def __str__(self):
        return self.subject
