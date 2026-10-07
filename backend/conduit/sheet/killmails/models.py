from django.db import models


class Killmail(models.Model):
    """A killmail. These are public and never change, so each is stored once."""

    id = models.BigIntegerField(primary_key=True)
    hash = models.CharField(max_length=64)
    time = models.DateTimeField(db_index=True)
    solar_system_id = models.IntegerField()
    victim_character_id = models.BigIntegerField(null=True)
    victim_corporation_id = models.BigIntegerField(null=True)
    victim_alliance_id = models.BigIntegerField(null=True)
    victim_ship_type_id = models.IntegerField()
    damage_taken = models.IntegerField()
    attacker_count = models.IntegerField()
    final_blow_character_id = models.BigIntegerField(null=True)
    value = models.FloatField(default=0)  # estimate at the time we fetched it
    data = models.JSONField()


class CharacterKillmail(models.Model):
    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="killmails")
    killmail = models.ForeignKey(Killmail, on_delete=models.CASCADE, related_name="involved")
    is_loss = models.BooleanField()

    class Meta:
        unique_together = [("character", "killmail")]
