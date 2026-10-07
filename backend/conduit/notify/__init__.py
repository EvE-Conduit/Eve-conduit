"""In-app notifications. ``from conduit.notify import notify`` once Django is ready."""


def notify(*args, **kwargs):
    from .services import notify as _notify

    return _notify(*args, **kwargs)
