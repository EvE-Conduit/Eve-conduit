from django.conf import settings
from django.db import models
from django.utils import timezone


class MumbleSettings(models.Model):
    """The Mumble server this site hands out accounts for. One row."""

    #: Where members connect: the address the Mumble client uses, and its port.
    host = models.CharField(max_length=200, blank=True)
    port = models.PositiveIntegerField(default=64738)
    #: Shown to members instead of the address, e.g. "Alliance comms".
    server_name = models.CharField(max_length=100, blank=True)
    #: The login name members type into Mumble (spaces become underscores). Fixed once the account exists.
    #: Placeholders: {character} {corp_ticker} {corp} {alliance_ticker} {alliance}.
    username_format = models.CharField(max_length=100, default="{character}")
    #: The name others see in Mumble; follows the main character and corporation.
    display_format = models.CharField(max_length=100, default="[{corp_ticker}] {character}")
    #: Remember a member's Mumble client certificate at their first password login; afterwards that certificate is
    #: enough (no password), as Mumble normally works.
    allow_cert_auth = models.BooleanField(default=True)
    #: Temporary access links.
    temp_enabled = models.BooleanField(default=True)
    #: The Mumble group guests get, for the server's ACLs.
    temp_group = models.CharField(max_length=50, default="temp")
    #: How guests appear in Mumble. Placeholder: {name}.
    temp_display_format = models.CharField(max_length=100, default="[TEMP] {name}")
    #: The longest a link (and the guests it lets in) may last.
    temp_max_hours = models.PositiveIntegerField(default=48)
    #: When the authenticator next to the Mumble server last called this site, and what it said it was.
    authenticator_seen_at = models.DateTimeField(null=True, blank=True)
    authenticator_version = models.CharField(max_length=40, blank=True)

    class Meta:
        verbose_name_plural = "Mumble settings"

    @classmethod
    def load(cls) -> "MumbleSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    @property
    def configured(self) -> bool:
        return bool(self.host)


class GroupMapping(models.Model):
    """Members of a group, or users in a state, are in a Mumble group (as the server's ACLs know it)."""

    group = models.ForeignKey("auth.Group", null=True, blank=True, on_delete=models.CASCADE, related_name="+")
    state = models.ForeignKey("access.State", null=True, blank=True, on_delete=models.CASCADE, related_name="+")
    mumble_group = models.CharField(max_length=50)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(group__isnull=False, state__isnull=True) | models.Q(group__isnull=True, state__isnull=False),
                name="mumble_mapping_group_or_state",
            ),
            models.UniqueConstraint(fields=["group", "mumble_group"], name="mumble_unique_group_mapping"),
            models.UniqueConstraint(fields=["state", "mumble_group"], name="mumble_unique_state_mapping"),
        ]


class MumbleUser(models.Model):
    """A member's Mumble account. The Mumble server never sees the password: its authenticator asks this site."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="mumble")
    #: The login name typed into Mumble. Unique across members and guests, compared without case.
    username = models.CharField(max_length=64, unique=True)
    #: The name shown in Mumble at the last login.
    display_name = models.CharField(max_length=100)
    password_hash = models.CharField(max_length=128)
    #: SHA-1 of the client certificate remembered at a password login; empty until then.
    cert_hash = models.CharField(max_length=40, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    password_changed_at = models.DateTimeField(default=timezone.now)
    last_login_at = models.DateTimeField(null=True, blank=True)
    #: The Mumble groups given at the last login.
    groups = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ["username"]
        permissions = [
            ("access_mumble", "Can have a Mumble account"),
            ("create_temp_links", "Can hand out temporary Mumble access links"),
            ("manage_mumble", "Can set up the Mumble server, its groups and accounts"),
        ]

    def __str__(self):
        return self.username


class TempLink(models.Model):
    """A link that gives whoever opens it a temporary Mumble login, until it expires."""

    token = models.CharField(max_length=48, unique=True)
    #: What it's for, e.g. "Diplo meeting Saturday".
    label = models.CharField(max_length=100)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    #: The link stops working then, and so do the logins it handed out.
    expires_at = models.DateTimeField()
    #: How many people may use it; 0 is no limit.
    max_uses = models.PositiveIntegerField(default=0)
    #: Mumble groups the guests get.
    groups = models.JSONField(default=list, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.label

    @property
    def uses(self) -> int:
        return self.users.count()

    def status(self, now=None) -> str:
        """active, revoked, expired or used_up."""
        now = now or timezone.now()
        if self.revoked_at:
            return "revoked"
        if self.expires_at <= now:
            return "expired"
        if self.max_uses and self.uses >= self.max_uses:
            return "used_up"
        return "active"


class TempUser(models.Model):
    """A guest's temporary Mumble login, made through a link."""

    link = models.ForeignKey(TempLink, on_delete=models.CASCADE, related_name="users")
    username = models.CharField(max_length=64, unique=True)
    display_name = models.CharField(max_length=100)
    password_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    created_ip = models.GenericIPAddressField(null=True, blank=True)
    expires_at = models.DateTimeField()
    last_login_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.username

    def usable(self, now=None) -> bool:
        now = now or timezone.now()
        return not self.revoked_at and self.expires_at > now and not self.link.revoked_at
