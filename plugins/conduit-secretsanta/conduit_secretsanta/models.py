from django.conf import settings
from django.db import models


class SantaEvent(models.Model):
    """One Secret Santa: sign-up, the draw, the results going out, gifts, and the end."""

    name = models.CharField(max_length=100)
    #: Shown to everyone who can see the event.
    description = models.TextField(blank=True)
    #: Only organisers see these.
    notes = models.TextField(blank=True)
    signup_closes_at = models.DateTimeField()
    gift_deadline = models.DateTimeField()
    #: A suggestion, in ISK. Empty means none.
    budget_isk = models.BigIntegerField(null=True, blank=True)
    #: Who may join: users in any of these states or groups. Both empty means every member.
    states = models.ManyToManyField("access.State", blank=True, related_name="+")
    groups = models.ManyToManyField("auth.Group", blank=True, related_name="+")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    #: The stored draw is in ``Participant.giftee``. It can be done again until the results are sent.
    drawn_at = models.DateTimeField(null=True, blank=True)
    #: Everyone was told who they give to. The draw is fixed from here on.
    published_at = models.DateTimeField(null=True, blank=True)
    #: The reminder before the gift deadline went out.
    reminded_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    #: After the end: every participant sees who gave to whom.
    reveal_all = models.BooleanField(default=False)

    class Meta:
        ordering = ["-signup_closes_at", "-pk"]
        permissions = [("organise_events", "Can run Secret Santa events, draw and see progress")]

    def __str__(self):
        return self.name


class Participant(models.Model):
    """One person (an account, so all their alts together) in an event, and the gift they give."""

    event = models.ForeignKey(SantaEvent, on_delete=models.CASCADE, related_name="participants")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    #: The character that should receive the gift. If it's unlinked, the gift goes to their main.
    character = models.ForeignKey("accounts.Character", null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    wishlist = models.TextField(blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    #: Who this person gives to, from the stored draw.
    giftee = models.OneToOneField("self", null=True, blank=True, on_delete=models.SET_NULL, related_name="santa")
    #: The gift this person gives: sent, with a note for the giftee; then received, with a thank-you, by the giftee.
    sent_at = models.DateTimeField(null=True, blank=True)
    sent_note = models.CharField(max_length=500, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)
    thanks = models.TextField(blank=True)

    class Meta:
        ordering = ["joined_at", "pk"]
        constraints = [models.UniqueConstraint(fields=["event", "user"], name="secretsanta_one_per_person")]

    def __str__(self):
        return self.user.display_name


class Exclusion(models.Model):
    """Two participants who must not draw each other, either way round (a couple, say)."""

    event = models.ForeignKey(SantaEvent, on_delete=models.CASCADE, related_name="exclusions")
    first = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name="+")
    second = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name="+")

    class Meta:
        ordering = ["pk"]
        constraints = [models.UniqueConstraint(fields=["first", "second"], name="secretsanta_unique_exclusion")]
