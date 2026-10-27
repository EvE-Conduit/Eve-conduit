from django.db import models


class Availability(models.Model):
    """A member saying whether one of their characters' hulls can be called on for ops, with a note."""

    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="capital_availability")
    #: The hull (ship type). One answer per character and hull, so it survives repackaging and asset re-syncs.
    type_id = models.IntegerField()
    available = models.BooleanField()
    note = models.CharField(max_length=300, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["character", "type_id"], name="capitals_availability_unique")]
        permissions = [
            ("view_registry", "Can see the Capital Registry of the characters they may view"),
        ]
