import pytest

from conduit.access.models import State
from conduit.eve import tasks
from conduit.esi.client import EsiResponse


class FakeEsi:
    def post(self, path, body):
        assert path == "/characters/affiliation"
        return EsiResponse([{"character_id": i, "corporation_id": 98000002, "alliance_id": 99000002} for i in body], 200, {})

    def get(self, path):
        if path == "/alliances/99000002":
            return EsiResponse({"name": "New Alliance", "ticker": "NEW"}, 200, {})
        assert path == "/corporations/98000002"
        return EsiResponse({"name": "New Corp", "ticker": "NCRP", "alliance_id": 99000002, "member_count": 12}, 200, {})


@pytest.mark.django_db
def test_affiliation_update_moves_user_into_member_state(user, monkeypatch):
    monkeypatch.setattr(tasks, "esi", lambda: FakeEsi())
    State.objects.create(name="Guest", priority=0, public=True)
    member = State.objects.create(name="Member", priority=10)
    from conduit.eve.models import EveAlliance

    member.member_alliances.add(EveAlliance.objects.create(id=99000002))

    assert tasks.update_affiliations.run() == 1
    user.refresh_from_db()
    assert user.main_character.corporation.name == "New Corp"
    assert user.state == member


def _member_state():
    from conduit.eve.models import EveAlliance

    State.objects.create(name="Guest", priority=0, public=True)
    member = State.objects.create(name="Member", priority=10)
    member.member_alliances.add(EveAlliance.objects.create(id=99000002))
    return member


@pytest.mark.django_db
def test_character_unlinked_mid_run_does_not_stop_the_others(user, monkeypatch):
    from conduit.accounts.models import Character

    from .conftest import make_user

    other = make_user(90000002, "Pilot Two")

    class Unlinking(FakeEsi):
        def post(self, path, body):
            Character.objects.filter(pk=user.main_character.pk).delete()  # unlinked while ESI answers
            return super().post(path, body)

    monkeypatch.setattr(tasks, "esi", lambda: Unlinking())
    member = _member_state()
    assert tasks.update_affiliations.run() == 2
    other.refresh_from_db()
    assert other.state == member and other.main_character.corporation_id == 98000002


@pytest.mark.django_db
def test_failed_recompute_keeps_the_change_for_the_next_run(user, monkeypatch):
    """Saved and recomputed together: a crash leaves the character as it was, so the next run sees the change again."""
    from conduit.access import services

    from .conftest import make_user

    other = make_user(90000002, "Pilot Two")
    monkeypatch.setattr(tasks, "esi", lambda: FakeEsi())
    member = _member_state()
    real = services.recompute_user_state

    def flaky(u):
        if u.pk == user.pk:
            raise RuntimeError("boom")
        return real(u)

    monkeypatch.setattr(services, "recompute_user_state", flaky)
    tasks.update_affiliations.run()
    other.refresh_from_db()
    assert other.state == member
    user.main_character.refresh_from_db()
    assert user.main_character.corporation_id is None  # rolled back, still a change next time

    monkeypatch.setattr(services, "recompute_user_state", real)
    tasks.update_affiliations.run()
    user.refresh_from_db()
    assert user.state == member and user.main_character.corporation_id == 98000002
