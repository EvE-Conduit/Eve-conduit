from functools import wraps

from ninja.errors import HttpError


def require_perm(*perms: str):
    """Ninja view decorator: 403 unless the user holds every permission."""

    def decorator(view):
        @wraps(view)
        def wrapper(request, *args, **kwargs):
            if not request.user.has_perms(perms):
                raise HttpError(403, "You do not have permission to do that")
            return view(request, *args, **kwargs)

        return wrapper

    return decorator
