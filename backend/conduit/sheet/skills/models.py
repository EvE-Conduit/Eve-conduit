from django.db import models


class SkillSummary(models.Model):
    character = models.OneToOneField("accounts.Character", primary_key=True, on_delete=models.CASCADE, related_name="skill_summary")
    total_sp = models.BigIntegerField(default=0)
    unallocated_sp = models.BigIntegerField(default=0)
    charisma = models.IntegerField(null=True)
    intelligence = models.IntegerField(null=True)
    memory = models.IntegerField(null=True)
    perception = models.IntegerField(null=True)
    willpower = models.IntegerField(null=True)
    bonus_remaps = models.IntegerField(null=True)
    last_remap_date = models.DateTimeField(null=True)
    remap_available_date = models.DateTimeField(null=True)
    updated_at = models.DateTimeField(auto_now=True)


class CharacterSkill(models.Model):
    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="skills")
    skill_id = models.IntegerField(db_index=True)
    active_level = models.PositiveSmallIntegerField()
    trained_level = models.PositiveSmallIntegerField()
    skillpoints = models.BigIntegerField()

    class Meta:
        unique_together = [("character", "skill_id")]


class SkillQueueItem(models.Model):
    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="skill_queue")
    position = models.IntegerField()
    skill_id = models.IntegerField()
    finished_level = models.PositiveSmallIntegerField()
    start_date = models.DateTimeField(null=True)
    finish_date = models.DateTimeField(null=True)
    training_start_sp = models.BigIntegerField(null=True)
    level_start_sp = models.BigIntegerField(null=True)
    level_end_sp = models.BigIntegerField(null=True)

    class Meta:
        ordering = ["position"]
        unique_together = [("character", "position")]
