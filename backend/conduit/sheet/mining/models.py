from django.db import models


class MiningEntry(models.Model):
    """One line of the mining ledger: what was mined, where, on a given day."""

    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="mining")
    date = models.DateField(db_index=True)
    solar_system_id = models.IntegerField()
    type_id = models.IntegerField()
    quantity = models.BigIntegerField()

    class Meta:
        unique_together = [("character", "date", "solar_system_id", "type_id")]
        ordering = ["-date"]
