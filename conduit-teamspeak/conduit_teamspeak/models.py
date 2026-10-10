from django.conf import settings
from django.db import models

from conduit.accounts.crypto import EncryptedTextField


class TeamSpeakSettings(models.Model):
    """The TeamSpeak server this site manages through ServerQuery. One row."""

    #: Where ServerQuery listens: the server's address and its raw query port (10011 by default).
    query_host = models.CharField(max_length=200, blank=True)
    query_port = models.PositiveIntegerField(default=10011)
    #: A ServerQuery login made for this site (serveradmin works, but a login of its own is better).
    query_user = models.CharField(max_length=100, blank=True)
    query_password = EncryptedTextField(default="", blank=True)
    #: The virtual server to manage; 1 on a server that runs only one.
    server_id = models.PositiveIntegerField(default=1)
    #: Where members connect: empty uses the query host. The voice port is 9987 by default.
    public_host = models.CharField(max_length=200, blank=True)
    public_port = models.PositiveIntegerField(default=9987)
    #: Shown to members instead of the address, e.g. "Alliance comms". Empty: the server's own name.
    server_name = models.CharField(max_length=100, blank=True)
    #: The name the connect link fills in, and the description members get on the server (seen by admins).
    #: Placeholders: {character} {corp_ticker} {corp} {alliance_ticker} {alliance}.
    nickname_format = models.CharField(max_length=100, default="[{corp_ticker}] {character}")
    #: The server group every linked member with access is in; the privilege key hands it out. Made on the first
    #: connection check if it's 0.
    registered_sgid = models.PositiveIntegerField(default=0)
    #: Kick people off the server (when they're on it) once they lose access, besides taking their groups away.
    kick_without_access = models.BooleanField(default=False)
    #: Members who may use TeamSpeak must have linked it to count as compliant (Administration → Compliance and the
    #: Compliant group rule).
    require_for_compliance = models.BooleanField(default=False)
    #: This site's address is in the server's query_ip_allowlist.txt, so commands needn't be spaced out to stay
    #: under the query flood limit.
    allowlisted = models.BooleanField(default=False)
    #: What the last connection check found, so members and the mapping page needn't ask the server.
    server_groups = models.JSONField(default=list, blank=True)
    virtual_server_name = models.CharField(max_length=100, blank=True)
    server_version = models.CharField(max_length=100, blank=True)
    checked_at = models.DateTimeField(null=True, blank=True)
    last_full_sync = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "TeamSpeak settings"

    @classmethod
    def load(cls) -> "TeamSpeakSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    @property
    def configured(self) -> bool:
        return bool(self.query_host and self.query_user and self.query_password)

    @property
    def host(self) -> str:
        return self.public_host or self.query_host

    @property
    def display_name(self) -> str:
        return self.server_name or self.virtual_server_name or self.host

    def group_name(self, sgid: int) -> str:
        for g in self.server_groups:
            if g.get("sgid") == sgid:
                return g.get("name") or str(sgid)
        return str(sgid)


class GroupMapping(models.Model):
    """Members of a group, or users in a state, are in a TeamSpeak server group."""

    group = models.ForeignKey("auth.Group", null=True, blank=True, on_delete=models.CASCADE, related_name="+")
    state = models.ForeignKey("access.State", null=True, blank=True, on_delete=models.CASCADE, related_name="+")
    sgid = models.PositiveIntegerField()
    sg_name = models.CharField(max_length=100, blank=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(group__isnull=False, state__isnull=True) | models.Q(group__isnull=True, state__isnull=False),
                name="teamspeak_mapping_group_or_state",
            ),
            models.UniqueConstraint(fields=["group", "sgid"], name="teamspeak_unique_group_mapping"),
            models.UniqueConstraint(fields=["state", "sgid"], name="teamspeak_unique_state_mapping"),
        ]


class TeamSpeakUser(models.Model):
    """A member's TeamSpeak identity. Until they've used their privilege key it's a pending link: ``cldbid`` is
    empty and ``privilege_key`` holds the key they were given."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="teamspeak")
    #: The identity's database id on the server, once verified. One identity links to one member.
    cldbid = models.PositiveIntegerField(null=True, blank=True, unique=True)
    #: The identity's unique id (base64), once verified.
    uid = models.CharField(max_length=64, blank=True)
    #: The nickname seen at the last sync.
    nickname = models.CharField(max_length=100, blank=True)
    #: The privilege key, kept while the link is pending so the member can see it again.
    privilege_key = models.CharField(max_length=100, blank=True)
    #: Set on the identity by the privilege key (as a custom property), which is how the site finds it.
    verify_code = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    synced_at = models.DateTimeField(null=True, blank=True)
    #: Why the last sync failed, shown to the member and admins; empty when it worked.
    sync_error = models.CharField(max_length=300, blank=True)
    #: The mapped server groups (ids) given at the last sync.
    groups = models.JSONField(default=list, blank=True)
    #: When the identity last connected, as the server remembers it.
    last_connected_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["user_id"]
        permissions = [
            ("access_teamspeak", "Can link a TeamSpeak identity"),
            ("manage_teamspeak", "Can set up the TeamSpeak server and its groups"),
        ]

    def __str__(self):
        return self.nickname or self.uid or f"pending #{self.pk}"

    @property
    def pending(self) -> bool:
        return self.cldbid is None
