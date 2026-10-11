"""Comparing secrets people type in (the setup code, an OAuth state) without leaking timing."""

import secrets


def same_secret(expected: str, given: str) -> bool:
    """``secrets.compare_digest`` on str raises TypeError for non-ASCII input (a 500 for "é"); compare bytes."""
    return secrets.compare_digest(str(expected).encode(), str(given).encode())
