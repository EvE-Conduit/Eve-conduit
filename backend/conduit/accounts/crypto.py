"""Encryption at rest for SSO tokens."""

import base64
from functools import cache

from cryptography.fernet import Fernet, InvalidToken, MultiFernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from django.conf import settings
from django.db import models


def _derived_key() -> bytes:
    """The key used when CONDUIT_TOKEN_KEY isn't set: derived from SECRET_KEY."""
    derived = HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=b"conduit-token-key").derive(
        settings.SECRET_KEY.encode()
    )
    return base64.urlsafe_b64encode(derived)


@cache
def _fernet() -> MultiFernet:
    """Encrypts with CONDUIT_TOKEN_KEY (or the derived key). Decrypts with that, any CONDUIT_TOKEN_KEY_PREVIOUS,
    and the derived key, so setting or changing the key never locks existing tokens out. Run
    ``manage.py rotate_token_key`` afterwards to re-encrypt everything with the current key."""
    keys = []
    if settings.CONDUIT_TOKEN_KEY:
        keys.append(settings.CONDUIT_TOKEN_KEY.encode())
    keys += [k.encode() for k in settings.CONDUIT_TOKEN_KEY_PREVIOUS]
    keys.append(_derived_key())
    unique = list(dict.fromkeys(keys))
    return MultiFernet([Fernet(k) for k in unique])


def rotate(value: str) -> str:
    """Re-encrypt an encrypted value with the current key."""
    return _fernet().rotate(value.encode()).decode()


def encrypt(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode()


def decrypt(value: str) -> str:
    try:
        return _fernet().decrypt(value.encode()).decode()
    except InvalidToken as exc:
        raise ValueError("token could not be decrypted; was the secret key changed?") from exc


class EncryptedTextField(models.TextField):
    def from_db_value(self, value, expression, connection):
        return None if value is None else decrypt(value)

    def get_prep_value(self, value):
        value = super().get_prep_value(value)
        return None if value is None else encrypt(value)
