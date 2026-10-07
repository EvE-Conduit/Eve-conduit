from celery import shared_task


@shared_task
def update_smart_groups() -> dict:
    """Bring every smart group in line with its rules. Runs every 15 minutes from beat."""
    from .groups import evaluate_all

    return evaluate_all()


@shared_task
def update_user_groups(user_id: int) -> dict:
    """Re-check one user's smart groups and compliance after something about them changed."""
    from evecsm.accounts.models import User

    from .compliance import refresh_user
    from .groups import evaluate_user

    user = User.objects.filter(pk=user_id, is_active=True).select_related("main_character", "state").first()
    if user is None:
        return {}
    refresh_user(user)
    return evaluate_user(user)


@shared_task
def update_compliance() -> int:
    """Re-check every user's compliance. Runs every 30 minutes from beat."""
    from .compliance import refresh_all

    return refresh_all()
