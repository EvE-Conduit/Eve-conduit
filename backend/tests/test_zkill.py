import httpx
import pytest

from conduit.eve import zkill

from .conftest import make_user
from .fake_esi import CID
from .test_sheet import pilot  # noqa: F401  (fixture)

STATS = {
    "shipsDestroyed": 120, "shipsLost": 30, "iskDestroyed": 9_000_000_000, "iskLost": 1_000_000_000, "soloKills": 12,
    "dangerRatio": 80, "gangRatio": 65, "activepvp": {"kills": {"type": "Total Kills", "count": 4}},
    "topAllTime": [{"type": "character", "data": []}, {"type": "ship", "data": [{"kills": 50, "shipTypeID": 587}, {"kills": 20, "shipTypeID": 603}]}],
}


class Resp:
    def __init__(self, data, status=200):
        self.data, self.status_code = data, status

    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError("boom", request=None, response=None)

    def json(self):
        return self.data


class Calls(list):
    """The URLs asked for; set ``answer`` to change what zKillboard says."""

    answer = staticmethod(lambda url: Resp(STATS))


@pytest.fixture
def zkb(monkeypatch):
    calls = Calls()

    def get(url, **kwargs):
        calls.append(url)
        assert "EvE-Conduit" in kwargs["headers"]["User-Agent"]
        return calls.answer(url)

    monkeypatch.setattr("conduit.eve.zkill.httpx.get", get)
    return calls


def test_summarize():
    s = zkill.summarize(STATS)
    assert s["kills"] == 120 and s["losses"] == 30 and s["solo_kills"] == 12 and s["recent_kills"] == 4
    assert s["efficiency"] == 90.0 and s["danger_ratio"] == 80
    assert s["top_ships"] == [{"type_id": 587, "kills": 50}, {"type_id": 603, "kills": 20}]
    assert zkill.summarize({}) == {"available": False}


@pytest.mark.django_db
def test_stats_are_cached(zkb):
    first = zkill.stats("character", CID)
    assert first["available"] and first["url"] == f"https://zkillboard.com/character/{CID}/"
    assert zkill.stats("character", CID) == first
    assert zkb == [f"https://zkillboard.com/api/stats/characterID/{CID}/"]
    with pytest.raises(ValueError):
        zkill.stats("planet", 1)


@pytest.mark.django_db
def test_unknown_and_failing(zkb):
    zkb.answer = lambda url: Resp([])
    assert zkill.stats("corporation", 1)["available"] is False
    zkb.answer = lambda url: Resp(None, 503)
    out = zkill.stats("alliance", 2)
    assert out == {"available": False, "url": "https://zkillboard.com/alliance/2/"}


@pytest.mark.django_db
def test_sheet_route(pilot, zkb, client):
    client.force_login(pilot)
    out = client.get(f"/api/characters/{CID}/killmails/zkillboard").json()
    assert out["kills"] == 120 and out["top_ships"][0]["kills"] == 50 and out["top_ships"][0]["ship"]["id"] == 587
    client.force_login(make_user(90000050, "Stranger"))
    assert client.get(f"/api/characters/{CID}/killmails/zkillboard").status_code in (403, 404)


@pytest.mark.django_db
def test_corp_route_needs_access(corp, zkb, client, user, admin_user):
    client.force_login(user)
    assert client.get(f"/api/corporations/{corp.id}/killmails/zkillboard").status_code == 403
    client.force_login(admin_user)
    assert client.get(f"/api/corporations/{corp.id}/killmails/zkillboard").json()["kills"] == 120
    assert zkb == [f"https://zkillboard.com/api/stats/corporationID/{corp.id}/"]
