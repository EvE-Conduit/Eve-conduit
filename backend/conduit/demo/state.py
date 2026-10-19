"""Whether the code running now belongs to a demo request."""

from contextlib import contextmanager
from contextvars import ContextVar

_active: ContextVar[bool] = ContextVar("conduit_demo", default=False)

#: Set in the session by the demo sign-in. Only these sessions see the demo signed in.
SESSION_KEY = "conduit_demo"
USERNAME = "demo"
PASSWORD = "demo123"


def active() -> bool:
    return _active.get()


@contextmanager
def activate(on: bool = True):
    token = _active.set(on)
    try:
        yield
    finally:
        _active.reset(token)


def enabled() -> bool:
    """Whether an administrator switched demo mode on (read from the real database)."""
    from conduit.site.models import SiteSettings

    return bool(SiteSettings.objects.using("default").filter(pk=1).values_list("demo_mode", flat=True).first())


def cache_key(key, key_prefix, version):
    """The cache's KEY_FUNCTION: demo requests get keys of their own, so nothing cached for the real site (a
    member's wallet total, say) is shown in the demo, nor the other way round."""
    return f"{'demo:' if _active.get() else ''}{key_prefix}:{version}:{key}"
