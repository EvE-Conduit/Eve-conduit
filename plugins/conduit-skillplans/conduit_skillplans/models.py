from django.conf import settings
from django.db import models


class SkillPlan(models.Model):
    """An ordered list of skill levels to train. Shared plans belong to everyone; personal plans to their owner."""

    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    #: Free text to group plans by, e.g. "Doctrines", "Industry", "New players".
    category = models.CharField(max_length=50, blank=True)
    #: Ordered steps [[skill_id, level], ...], one per level, prerequisites first (``training.plan``).
    skills = models.JSONField(default=list)
    shared = models.BooleanField(default=False, db_index=True)
    #: Whose personal plan it is; empty for shared plans.
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name="+")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["category", "name"]
        permissions = [
            ("manage_plans", "Can create and edit shared skill plans"),
            ("view_progress", "Can see every member's progress on shared skill plans"),
        ]

    def __str__(self):
        return self.name
