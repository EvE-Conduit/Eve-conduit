from django.db import models

ACTIVITIES = {
    1: "Manufacturing",
    3: "Time efficiency research",
    4: "Material efficiency research",
    5: "Copying",
    7: "Reverse engineering",
    8: "Invention",
    9: "Reactions",
    11: "Reactions",
}


class IndustryJob(models.Model):
    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="industry_jobs")
    job_id = models.BigIntegerField()
    activity_id = models.SmallIntegerField()
    status = models.CharField(max_length=20, db_index=True)
    blueprint_id = models.BigIntegerField()
    blueprint_type_id = models.IntegerField()
    product_type_id = models.IntegerField(null=True)
    runs = models.IntegerField()
    licensed_runs = models.IntegerField(null=True)
    successful_runs = models.IntegerField(null=True)
    probability = models.FloatField(null=True)
    cost = models.DecimalField(max_digits=20, decimal_places=2, null=True)
    facility_id = models.BigIntegerField()
    station_id = models.BigIntegerField()
    output_location_id = models.BigIntegerField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(db_index=True)
    pause_date = models.DateTimeField(null=True)
    completed_date = models.DateTimeField(null=True)

    class Meta:
        unique_together = [("character", "job_id")]
        ordering = ["-start_date"]

    @property
    def activity(self) -> str:
        return ACTIVITIES.get(self.activity_id, f"Activity {self.activity_id}")
