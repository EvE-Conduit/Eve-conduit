from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

from conduit.eve.models import EveAlliance, EveCorporation, portrait_url

from .crypto import EncryptedTextField


class User(AbstractUser):
    """A person. They sign in with any of their characters and pick one as main."""

    main_character = models.OneToOneField(
        "accounts.Character", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    state = models.ForeignKey(
        "access.State", null=True, blank=True, on_delete=models.SET_NULL, related_name="users"
    )

    @property
    def display_name(self) -> str:
        return self.main_character.name if self.main_character else self.username


class Character(models.Model):
    """An EVE character owned by a user."""

    id = models.BigIntegerField(primary_key=True)  # EVE character id
    name = models.CharField(max_length=100)
    # Changes when the character is sold to another account; we drop ownership then.
    owner_hash = models.CharField(max_length=64)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="characters")
    corporation = models.ForeignKey(
        EveCorporation, null=True, blank=True, on_delete=models.SET_NULL, related_name="characters"
    )
    alliance = models.ForeignKey(
        EveAlliance, null=True, blank=True, on_delete=models.SET_NULL, related_name="characters"
    )
    added_at = models.DateTimeField(default=timezone.now)
    affiliation_updated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    @property
    def portrait(self) -> str:
        return portrait_url(self.id)


class Token(models.Model):
    """The SSO token of a character. One per character, holding every granted scope."""

    character = models.OneToOneField(Character, on_delete=models.CASCADE, related_name="token")
    access_token = EncryptedTextField()
    refresh_token = EncryptedTextField()
    expires_at = models.DateTimeField()
    scopes = models.TextField(blank=True)  # space separated
    valid = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def scope_set(self) -> set[str]:
        return set(self.scopes.split())

    def has_scopes(self, *scopes: str) -> bool:
        return self.valid and set(scopes) <= self.scope_set


class UserPreferences(models.Model):
    """How a person likes the site: theme, density, time display, muted notifications, plugin settings."""

    class Theme(models.TextChoices):
        SYSTEM = "system"
        DARK = "dark"
        LIGHT = "light"

    class Density(models.TextChoices):
        COMFORTABLE = "comfortable"
        COMPACT = "compact"

    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name="preferences")
    theme = models.CharField(max_length=10, choices=Theme.choices, default=Theme.DARK)
    density = models.CharField(max_length=12, choices=Density.choices, default=Density.COMFORTABLE)
    #: IANA name; times are shown in this zone next to EVE time (UTC).
    timezone = models.CharField(max_length=64, default="UTC")
    clock_24h = models.BooleanField(default=True)
    reduce_motion = models.BooleanField(default=False)
    #: Text size step: 0 normal, 1 larger, 2 largest.
    text_scale = models.PositiveSmallIntegerField(default=0)
    high_contrast = models.BooleanField(default=False)
    muted_categories = models.JSONField(default=list, blank=True)
    #: Hidden/ordered dashboard widgets: {"hidden": ["Wallet:networth"], "order": [...]}.
    dashboard = models.JSONField(default=dict, blank=True)
    #: Per-plugin settings, keyed by plugin id. Each plugin owns its own value.
    plugins = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "user preferences"

    @classmethod
    def for_user(cls, user) -> "UserPreferences":
        prefs, _ = cls.objects.get_or_create(user=user)
        return prefs
