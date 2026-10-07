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
