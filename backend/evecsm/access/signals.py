from django.db.models.signals import m2m_changed, post_save
from django.dispatch import receiver

from .models import State
from .services import recompute_all_states


@receiver(post_save, sender=State)
def state_saved(sender, **kwargs):
    recompute_all_states()


for field in ("member_characters", "member_corporations", "member_alliances"):
    m2m_changed.connect(
        lambda action, **kw: recompute_all_states() if action.startswith("post_") else None,
        sender=getattr(State, field).through,
        weak=False,
    )
