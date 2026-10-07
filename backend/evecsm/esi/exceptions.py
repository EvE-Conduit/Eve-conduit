class EsiError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(f"ESI {status}: {message}")
        self.status = status


class EsiBackoff(Exception):
    """ESI must not be called right now. Retry after ``retry_after`` seconds."""

    def __init__(self, retry_after: float, reason: str):
        super().__init__(f"{reason}; retry in {retry_after:.0f}s")
        self.retry_after = retry_after


class EsiRateLimited(EsiBackoff):
    def __init__(self, retry_after: float, group: str):
        super().__init__(retry_after, f"ESI rate limit hit for {group}")
        self.group = group


class TokenInvalid(Exception):
    """The character's refresh token was revoked or expired; they must log in again."""
