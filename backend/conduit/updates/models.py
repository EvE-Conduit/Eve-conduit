from django.conf import settings
from django.db import models


class UpdateState(models.Model):
    """What the site knows about newer releases, and how far a download/install has got. One row."""

    class Download(models.TextChoices):
        NONE = "none"
        DOWNLOADING = "downloading"
        READY = "ready"
        FAILED = "failed"

    class Install(models.TextChoices):
        NONE = "none"
        REQUESTED = "requested"
        RUNNING = "running"
        SUCCEEDED = "succeeded"
        FAILED = "failed"

    checked_at = models.DateTimeField(null=True, blank=True)
    check_error = models.CharField(max_length=300, blank=True)
    #: Releases newer than the running version, newest first: [{version, name, notes, published_at, url, assets}].
    releases = models.JSONField(default=list, blank=True)
    #: Newest version admins were already told about.
    notified_version = models.CharField(max_length=20, blank=True)

    download_state = models.CharField(max_length=12, choices=Download.choices, default=Download.NONE)
    download_version = models.CharField(max_length=20, blank=True)
    download_file = models.CharField(max_length=120, blank=True)
    download_size = models.BigIntegerField(default=0)
    download_received = models.BigIntegerField(default=0)
    download_error = models.CharField(max_length=300, blank=True)

    install_state = models.CharField(max_length=12, choices=Install.choices, default=Install.NONE)
    install_version = models.CharField(max_length=20, blank=True)
    install_requested_at = models.DateTimeField(null=True, blank=True)
    install_requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    install_message = models.TextField(blank=True)

    @classmethod
    def load(cls) -> "UpdateState":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
