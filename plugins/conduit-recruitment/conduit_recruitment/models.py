from django.conf import settings
from django.contrib.auth.models import Group
from django.db import models


class Form(models.Model):
    """What applicants fill in, e.g. one per corporation that's recruiting."""

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    #: [{id, label, help, kind: text|long|yesno|choice, choices: [...], required}]
    questions = models.JSONField(default=list, blank=True)
    #: Groups an accepted applicant is added to.
    accept_groups = models.ManyToManyField(Group, blank=True, related_name="+")
    open = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "name"]
        permissions = [
            ("review_applications", "Can review recruitment applications and accept or reject them"),
            ("manage_forms", "Can set up recruitment forms"),
        ]

    def __str__(self):
        return self.name


class Application(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "New"
        REVIEW = "review", "In review"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        WITHDRAWN = "withdrawn", "Withdrawn"

    OPEN = (Status.NEW, Status.REVIEW)

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="applications")
    form = models.ForeignKey(Form, on_delete=models.PROTECT, related_name="applications")
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.NEW, db_index=True)
    #: {question id: answer}
    answers = models.JSONField(default=dict)
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    decided_at = models.DateTimeField(null=True, blank=True)
    decided_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")

    class Meta:
        ordering = ["-created_at"]

    @property
    def is_open(self) -> bool:
        return self.status in self.OPEN


class Comment(models.Model):
    """A message on an application. Internal notes are only for recruiters."""

    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="+")
    text = models.TextField()
    internal = models.BooleanField(default=False)
    #: Status changes are logged as comments too ("accepted", "claimed"...).
    event = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
