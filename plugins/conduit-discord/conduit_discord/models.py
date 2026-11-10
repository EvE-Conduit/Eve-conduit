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
    #: Members who may link Discord must be on the server to count as compliant (Administration → Compliance and the
    #: Compliant group rule). Needs EvE Conduit 0.5.20 or newer.
    require_for_compliance = models.BooleanField(default=False)
    last_full_sync = models.DateTimeField(null=True, blank=True)
    #: Temporary access: people with discord.create_guest_links hand out links that let someone without an account
    #: here onto the server for a while. They get two roles. The guest role marks them as a guest and is kept for
    #: good; it is the one hidden from every channel when channels are limited, so a former guest sees nothing.
    guest_enabled = models.BooleanField(default=False)
    guest_role_id = models.CharField(max_length=32, blank=True)
    guest_role_name = models.CharField(max_length=100, blank=True)
    #: The temporary role ("tempaccess") is given for as long as the link lasts and taken away when it ends. Empty
    #: on sites set up before 1.4: the guest role itself is then the one taken away.
    guest_temp_role_id = models.CharField(max_length=32, blank=True)
    guest_temp_role_name = models.CharField(max_length=100, blank=True)
    #: The longest a link may last.
    guest_max_hours = models.PositiveIntegerField(default=72)
    #: What happens to guests when their link ends: "role" takes the temporary role (and their channels) away and
    #: leaves them on the server with the guest role; "kick" removes them from it. Someone who was on the server before using a link
    #: is never removed, whichever is chosen.
    guest_end_action = models.CharField(max_length=8, default="role")
    #: How guests appear on the server; empty leaves their name alone. Placeholder: {name}.
    guest_nickname_format = models.CharField(max_length=60, default="[GUEST] {name}", blank=True)
    #: The channels guests may be let into, as [{"id", "name", "kind"}]. While any are chosen the bot hides every
    #: other channel from the guest role, and each link opens some of these to its guests. Empty: guests see
    #: whatever the guest role sees on Discord.
    guest_channels = models.JSONField(default=list, blank=True)

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
    #: Whether they were on the server at the last sync (every 6 hours, on group changes and on Fix my roles).
    on_server = models.BooleanField(default=True)

    class Meta:
        ordering = ["username"]
        permissions = [
            ("access_discord", "Can link a Discord account and join the server"),
            ("manage_discord", "Can set up the Discord server and its roles"),
            ("create_guest_links", "Can hand out temporary access to the Discord server"),
        ]

    def __str__(self):
        return self.username


class GuestLink(models.Model):
    """A link that lets whoever opens it onto the Discord server, with the guest role, until it expires."""

    token = models.CharField(max_length=48, unique=True)
    #: What it's for, e.g. "Diplo meeting Saturday". Guests see it.
    label = models.CharField(max_length=100)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    #: The link stops working then, and the guests it let in are removed from the server.
    expires_at = models.DateTimeField()
    #: How many people may use it; 0 is no limit.
    max_uses = models.PositiveIntegerField(default=0)
    #: The guest role when the link was made: its guests get it and keep it.
    role_id = models.CharField(max_length=32)
    role_name = models.CharField(max_length=100, blank=True)
    #: The temporary role when the link was made: its guests have it until their stay ends. Empty: the guest role
    #: is the one taken away.
    temp_role_id = models.CharField(max_length=32, blank=True)
    temp_role_name = models.CharField(max_length=100, blank=True)
    #: The channels this link opens to its guests, as [{"id", "name", "kind"}]; empty when channels aren't limited.
    channels = models.JSONField(default=list, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.label


class Guest(models.Model):
    """Someone a guest link put on the server. Only people who weren't on it already: nobody who was there before
    is ever removed because a link ran out."""

    link = models.ForeignKey(GuestLink, on_delete=models.CASCADE, related_name="guests")
    discord_id = models.CharField(max_length=32)
    username = models.CharField(max_length=100)
    avatar_url = models.CharField(max_length=300, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    #: Set once their stay ended: the temporary role was taken away, or they were removed from the server.
    ended_at = models.DateTimeField(null=True, blank=True)
    #: Why it ended: expired, revoked (the link was withdrawn), removed (this guest alone), creator_lost, member.
    ended_reason = models.CharField(max_length=20, blank=True)
    #: Why the last try to remove them failed; tried again every couple of minutes.
    error = models.CharField(max_length=300, blank=True)
    #: They were on the server before using the link, so they are never removed from it when the stay ends.
    was_on_server = models.BooleanField(default=False)
    #: They already had the role the link takes away at the end (given by hand), so it is left with them.
    had_role = models.BooleanField(default=False)
    #: The guest nickname was set, and what they were called before, to put back when the stay ends.
    nick_set = models.BooleanField(default=False)
    previous_nick = models.CharField(max_length=32, blank=True)

    class Meta:
        ordering = ["joined_at"]
        constraints = [
            # One stay at a time per Discord account.
            models.UniqueConstraint(fields=["discord_id"], condition=models.Q(ended_at__isnull=True), name="discord_one_stay_per_guest"),
        ]

    def __str__(self):
        return self.username
