from django.conf import settings
from django.db import models

from conduit.accounts.crypto import EncryptedTextField


class DiscordSettings(models.Model):
    """The Discord application and server this site is linked to. One row."""

    #: From the Discord developer portal (OAuth2 page).
    client_id = models.CharField(max_length=32, blank=True)
    client_secret = EncryptedTextField(default="", blank=True)
    #: The bot's token (Bot page). It adds members, gives roles and sets nicknames.
    bot_token = EncryptedTextField(default="", blank=True)
    #: The server (guild) id: right-click the server with Developer Mode on → Copy Server ID.
    guild_id = models.CharField(max_length=32, blank=True)
    guild_name = models.CharField(max_length=100, blank=True)
    #: Nickname given on the server; empty leaves nicknames alone.
    #: Placeholders: {character} {corp_ticker} {corp} {alliance_ticker} {alliance}.
    nickname_format = models.CharField(max_length=100, default="[{corp_ticker}] {character}", blank=True)
    #: Remove people from the server once they lose access, instead of only taking the roles away.
    kick_without_access = models.BooleanField(default=False)
    last_full_sync = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "Discord settings"

    @classmethod
    def load(cls) -> "DiscordSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    @property
    def configured(self) -> bool:
        return bool(self.client_id and self.client_secret and self.bot_token and self.guild_id)


class RoleMapping(models.Model):
    """Members of a group, or users in a state, get a Discord role."""

    group = models.ForeignKey("auth.Group", null=True, blank=True, on_delete=models.CASCADE, related_name="+")
    state = models.ForeignKey("access.State", null=True, blank=True, on_delete=models.CASCADE, related_name="+")
    role_id = models.CharField(max_length=32)
    role_name = models.CharField(max_length=100, blank=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(group__isnull=False, state__isnull=True) | models.Q(group__isnull=True, state__isnull=False),
                name="discord_mapping_group_or_state",
            ),
            models.UniqueConstraint(fields=["group", "role_id"], name="discord_unique_group_role"),
            models.UniqueConstraint(fields=["state", "role_id"], name="discord_unique_state_role"),
        ]


class DiscordAccount(models.Model):
    """A member's linked Discord account."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="discord")
    discord_id = models.CharField(max_length=32, unique=True)
    username = models.CharField(max_length=100)
    avatar_url = models.CharField(max_length=300, blank=True)
    linked_at = models.DateTimeField(auto_now_add=True)
    synced_at = models.DateTimeField(null=True, blank=True)
    #: Why the last sync failed, shown to the member and admins; empty when it worked.
    sync_error = models.CharField(max_length=300, blank=True)
    #: The mapped roles the member had at the last sync.
    roles = models.JSONField(default=list, blank=True)
    nickname = models.CharField(max_length=32, blank=True)

    class Meta:
        ordering = ["username"]
        permissions = [
            ("access_discord", "Can link a Discord account and join the server"),
            ("manage_discord", "Can set up the Discord server and its roles"),
        ]

    def __str__(self):
        return self.username
