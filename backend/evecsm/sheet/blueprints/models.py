from django.db import models


class Blueprint(models.Model):
    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="blueprints")
    item_id = models.BigIntegerField()
    type_id = models.IntegerField(db_index=True)
    location_id = models.BigIntegerField()
    root_location_id = models.BigIntegerField()
    location_flag = models.CharField(max_length=60)
    #: -1 = original, -2 = copy, >0 = a stack of originals
    quantity = models.IntegerField()
    #: -1 = infinite (original)
    runs = models.IntegerField()
    material_efficiency = models.SmallIntegerField()
    time_efficiency = models.SmallIntegerField()

    class Meta:
        unique_together = [("character", "item_id")]

    @property
    def is_copy(self) -> bool:
        return self.quantity == -2
