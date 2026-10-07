from django.db import models


class ResearchAgent(models.Model):
    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="research_agents")
    agent_id = models.IntegerField()
    skill_type_id = models.IntegerField()
    started_at = models.DateTimeField()
    points_per_day = models.FloatField()
    remainder_points = models.FloatField()

    class Meta:
        unique_together = [("character", "agent_id")]
