from django.db import models


class Fitting(models.Model):
    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="fittings")
    fitting_id = models.IntegerField()
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    ship_type_id = models.IntegerField()
    items = models.JSONField(default=list)  # [{"flag", "quantity", "type_id"}]

    class Meta:
        unique_together = [("character", "fitting_id")]
