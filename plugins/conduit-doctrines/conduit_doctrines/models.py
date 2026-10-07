from django.conf import settings
from django.db import models


class Fit(models.Model):
    """One ship fitting. A fit can be part of several doctrines."""

    name = models.CharField(max_length=100)
    ship_type_id = models.IntegerField()
    #: [{"slot": "hi"|"med"|"low"|"rig"|"sub"|"service"|"drone"|"fighter"|"cargo", "position": int,
    #:   "type_id": int, "charge_id": int | None, "quantity": int, "offline": bool}]
    items = models.JSONField(default=list)
    #: DPS, Logistics, Tackle... (free text; the UI suggests the usual ones).
    role = models.CharField(max_length=40, blank=True)
    notes = models.TextField(blank=True)
    #: Skills the FCs want on top of what the fit needs: [[skill_id, level], ...].
    recommended = models.JSONField(default=list)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Doctrine(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    #: The ship whose picture stands for the doctrine (defaults to its first fit's ship).
    icon_type_id = models.IntegerField(null=True, blank=True)
    order = models.IntegerField(default=0)
    #: Retired doctrines stay for reference but are listed last and don't count in the widget.
    active = models.BooleanField(default=True)
    fits = models.ManyToManyField(Fit, through="DoctrineFit", related_name="doctrines")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-active", "order", "name"]
        permissions = [
            ("manage_doctrines", "Can create and edit doctrines and fits"),
            ("view_readiness", "Can see who can fly each doctrine"),
        ]

    def __str__(self):
        return self.name


class DoctrineFit(models.Model):
    doctrine = models.ForeignKey(Doctrine, on_delete=models.CASCADE, related_name="entries")
    fit = models.ForeignKey(Fit, on_delete=models.CASCADE, related_name="entries")
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ["order", "pk"]
        unique_together = [("doctrine", "fit")]
