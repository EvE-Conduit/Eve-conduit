import hashlib
import ipaddress
import secrets

from django.conf import settings
from django.db import models
from django.utils import timezone

KEY_PREFIX = "evk_"


def hash_secret(secret: str) -> str:
    # Secrets are 256-bit random strings, so a plain SHA-256 is enough (no need for a slow hash).
    return hashlib.sha256(secret.encode()).hexdigest()


class ApiKey(models.Model):
    """A credential for one external service. The secret itself is only shown once, at creation."""

    name = models.CharField(max_length=80)
    description = models.CharField(max_length=300, blank=True)
    prefix = models.CharField(max_length=16, unique=True)  # "evk_ab12cd34": identifies the key, not secret
    secret_hash = models.CharField(max_length=64)
    scopes = models.JSONField(default=list, blank=True)
    allowed_ips = models.JSONField(default=list, blank=True)  # IPs/CIDRs; empty means any
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    last_used_at = models.DateTimeField(null=True, blank=True)
    last_used_ip = models.GenericIPAddressField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return self.name

    @classmethod
    def issue(cls, **fields) -> tuple["ApiKey", str]:
        """Create a key; returns it with the secret to hand to the service."""
        while True:
            prefix = KEY_PREFIX + secrets.token_hex(4)
            if not cls.objects.filter(prefix=prefix).exists():
                break
        secret = f"{prefix}_{secrets.token_urlsafe(32)}"
        key = cls.objects.create(prefix=prefix, secret_hash=hash_secret(secret), **fields)
        return key, secret

    @property
    def status(self) -> str:
        if self.revoked_at:
            return "revoked"
        if self.expires_at and self.expires_at <= timezone.now():
            return "expired"
        return "active"

    def ip_allowed(self, ip: str | None) -> bool:
        if not self.allowed_ips:
            return True
        if not ip:
            return False
        try:
            addr = ipaddress.ip_address(ip)
        except ValueError:
            return False
        return any(addr in ipaddress.ip_network(net, strict=False) for net in self.allowed_ips)


class ApiArea(models.Model):
    """Whether one API (see areas.py) is switched on. Missing rows mean off."""

    key = models.CharField(max_length=80, primary_key=True)
    enabled = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.key} ({'on' if self.enabled else 'off'})"


class ApiRequest(models.Model):
    """One call to /api/v1/, successful or not."""

    at = models.DateTimeField(default=timezone.now, db_index=True)
    key = models.ForeignKey(ApiKey, null=True, blank=True, on_delete=models.SET_NULL, related_name="requests")
    key_prefix = models.CharField(max_length=16, blank=True)  # kept when the key is deleted
    method = models.CharField(max_length=8)
    path = models.CharField(max_length=500)
    query = models.CharField(max_length=1000, blank=True)
    status = models.PositiveSmallIntegerField()
    duration_ms = models.PositiveIntegerField(default=0)
    ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=300, blank=True)
    area = models.CharField(max_length=80, blank=True, db_index=True)

    class Meta:
        ordering = ["-id"]
        indexes = [models.Index(fields=["key", "at"])]

    def __str__(self):
        return f"{self.method} {self.path} {self.status}"
