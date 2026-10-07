from django.db import models


class Colony(models.Model):
    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="colonies")
    planet_id = models.IntegerField()
    planet_name = models.CharField(max_length=100, blank=True)
    planet_type = models.CharField(max_length=20)
    solar_system_id = models.IntegerField()
    upgrade_level = models.SmallIntegerField()
    num_pins = models.SmallIntegerField()
    last_update = models.DateTimeField()
    #: The colony layout from ESI (pins, links, routes).
    layout = models.JSONField(default=dict)

    class Meta:
        unique_together = [("character", "planet_id")]
