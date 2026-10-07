from django.db import models


class Asset(models.Model):
    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="assets")
    item_id = models.BigIntegerField()
    type_id = models.IntegerField(db_index=True)
    quantity = models.IntegerField()
    location_id = models.BigIntegerField()
    location_type = models.CharField(max_length=20)
    location_flag = models.CharField(max_length=60)
    is_singleton = models.BooleanField()
    is_blueprint_copy = models.BooleanField(null=True)
    #: Player-given name of a ship or container.
    name = models.CharField(max_length=100, blank=True)
    #: The station, structure or system the item ultimately sits in.
    root_location_id = models.BigIntegerField(db_index=True)

    class Meta:
        unique_together = [("character", "item_id")]
