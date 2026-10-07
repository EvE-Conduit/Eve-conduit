from django.db import models


class CharacterInfo(models.Model):
    """Everything on the overview sheet that is one value per character."""

    character = models.OneToOneField("accounts.Character", primary_key=True, on_delete=models.CASCADE, related_name="info")
    # public
    birthday = models.DateTimeField(null=True)
    gender = models.CharField(max_length=10, blank=True)
    race_id = models.IntegerField(null=True)
    bloodline_id = models.IntegerField(null=True)
    security_status = models.FloatField(null=True)
    description = models.TextField(blank=True)
    title = models.CharField(max_length=200, blank=True)
    faction_id = models.IntegerField(null=True)
    # location / ship / online
    solar_system_id = models.IntegerField(null=True)
    station_id = models.BigIntegerField(null=True)
    structure_id = models.BigIntegerField(null=True)
    ship_type_id = models.IntegerField(null=True)
    ship_name = models.CharField(max_length=100, blank=True)
    online = models.BooleanField(null=True)
    last_login = models.DateTimeField(null=True)
    last_logout = models.DateTimeField(null=True)
    logins = models.IntegerField(null=True)
    # clones
    home_location_id = models.BigIntegerField(null=True)
    last_clone_jump_date = models.DateTimeField(null=True)
    implants = models.JSONField(default=list)  # [type_id]
    jump_clones = models.JSONField(default=list)  # [{jump_clone_id, location_id, name, implants: [type_id]}]
    # misc
    jump_fatigue_expires = models.DateTimeField(null=True)
    last_jump_date = models.DateTimeField(null=True)
    titles = models.JSONField(default=list)  # [name]
    roles = models.JSONField(default=list)  # [role]
    updated_at = models.DateTimeField(auto_now=True)


class CorporationHistory(models.Model):
    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="corporation_history")
    record_id = models.IntegerField()
    corporation_id = models.BigIntegerField()
    start_date = models.DateTimeField()
    is_deleted = models.BooleanField(default=False)

    class Meta:
        unique_together = [("character", "record_id")]
        ordering = ["-start_date"]
