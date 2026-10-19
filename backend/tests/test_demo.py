import pytest

from conduit.accounts.models import Character, User
from conduit.demo import database, state
from conduit.site.models import SiteSettings

from .conftest import make_user

DEMO_DB = pytest.mark.django_db(databases=["default", "demo"])


@pytest.fixture(scope="session")
def demo_database(django_db_setup, django_db_blocker):
    with django_db_blocker.unblock():
        database.build(force=True)


@pytest.fixture
def demo_on(demo_database, db):
    SiteSettings.load()
    SiteSettings.objects.filter(pk=1).update(demo_mode=True, setup_completed=True)


def demo_login(client, password=state.PASSWORD):
    return client.post("/api/core/demo/login", {"username": state.USERNAME, "password": password}, content_type="application/json")


@DEMO_DB
def test_visitors_see_example_data_and_the_real_data_is_untouched(client, demo_on, corp):
    real = make_user(90000001, "Real Pilot", corporation=corp)
    site = client.get("/api/core/bootstrap").json()["site"]
    assert site["demo"] == {"enabled": True, "active": True, "username": "demo", "password": "demo123"}

    assert demo_login(client).status_code == 200
    me = client.get("/api/core/bootstrap").json()["user"]
    assert me["is_admin"] and me["main"]["id"] >= 1_700_000_000
    names = [c["name"] for c in client.get("/api/me/characters").json()]
    assert names and "Real Pilot" not in names

    # Nothing of the demo reached the real database, and nothing real is in the demo.
    assert list(User.objects.values_list("pk", flat=True)) == [real.pk]
    assert not Character.objects.filter(pk__gte=1_700_000_000).exists()
    with state.activate():
        assert not Character.objects.filter(pk=90000001).exists()
        assert User.objects.filter(username="demo").exists()


@DEMO_DB
def test_the_demo_is_read_only(client, demo_on):
    demo_login(client)
    resp = client.put("/api/admin/site", {"name": "Hacked", "accent": "#000000"}, content_type="application/json")
    assert resp.status_code == 403 and resp.json()["demo"] is True
    assert client.put("/api/admin/demo", {"enabled": False}, content_type="application/json").status_code == 403
    assert SiteSettings.objects.get(pk=1).name != "Hacked" and state.enabled()


@DEMO_DB
def test_wrong_password_and_demo_off(client, demo_on):
    assert demo_login(client, "nope").status_code == 400
    SiteSettings.objects.filter(pk=1).update(demo_mode=False)
    assert demo_login(client).status_code == 404


@DEMO_DB
def test_admins_keep_the_real_site_and_members_get_theirs_back(client, demo_on, corp):
    admin = make_user(90000099, "Admin Pilot", corporation=corp)
    admin.is_superuser = True
    admin.save()
    client.force_login(admin)
    site = client.get("/api/core/bootstrap").json()
    assert site["site"]["demo"] == {"enabled": True, "active": False} and site["user"]["name"] == "Admin Pilot"

    member = make_user(90000002, "Member Pilot", corporation=corp)
    client.force_login(member)
    assert client.get("/api/core/bootstrap").json()["user"] is None  # signed out of the demo
    SiteSettings.objects.filter(pk=1).update(demo_mode=False)
    assert client.get("/api/core/bootstrap").json()["user"]["name"] == "Member Pilot"  # and back afterwards


@DEMO_DB
def test_demo_sessions_never_reach_the_real_site(client, demo_on):
    demo_login(client)
    SiteSettings.objects.filter(pk=1).update(demo_mode=False)
    assert client.get("/api/core/bootstrap").json()["user"] is None


@DEMO_DB
def test_admin_switches_demo_mode(api_client, admin_user, monkeypatch):
    built = []
    monkeypatch.setattr(database, "ready", lambda: False)
    monkeypatch.setattr(database, "build_in_background", lambda: built.append(True))
    api_client.force_login(admin_user)
    resp = api_client.call("put", "/api/admin/demo", {"enabled": True})
    assert resp.status_code == 200 and resp.json()["enabled"] and built
    assert api_client.get("/api/admin/demo").json()["enabled"]
    assert api_client.call("put", "/api/admin/demo", {"enabled": False}).json()["enabled"] is False


@DEMO_DB
def test_visitors_wait_while_the_demo_is_built(client, monkeypatch):
    SiteSettings.load()
    SiteSettings.objects.filter(pk=1).update(demo_mode=True)
    monkeypatch.setattr(database, "ready", lambda: False)
    monkeypatch.setattr(database, "build_in_background", lambda: None)
    resp = client.get("/api/core/bootstrap")
    assert resp.status_code == 503 and resp.json()["maintenance"] is True


@pytest.mark.django_db
def test_sso_refuses_members_during_demo_mode(client, monkeypatch, corp):
    from conduit.sso import views

    make_user(90000003, "Member Pilot", corporation=corp)
    SiteSettings.load()
    SiteSettings.objects.filter(pk=1).update(demo_mode=True)
    monkeypatch.setattr(views, "exchange_code", lambda code, verifier: {"access_token": "a", "refresh_token": "r", "expires_in": 1199})
    monkeypatch.setattr(views, "verify_access_token", lambda t: {"sub": "CHARACTER:EVE:90000003", "name": "Member Pilot", "owner": "hash-90000003", "scp": "publicData"})
    client.get("/sso/login")
    resp = client.get(f"/sso/callback?code=abc&state={client.session['conduit_sso']['state']}")
    assert "error=demo_mode" in resp["Location"] and "_auth_user_id" not in client.session


def test_demo_requests_start_no_jobs_call_no_esi_and_cache_apart(monkeypatch):
    from celery.app.task import Task
    from django.core.cache import cache

    from conduit.esi.client import EsiClient
    from conduit.esi.exceptions import EsiError
    from conduit.eve.tasks import update_market_prices

    sent = []
    monkeypatch.setattr(Task, "apply_async", lambda self, *a, **k: sent.append(self.name))
    with state.activate():
        update_market_prices.delay()
        with pytest.raises(EsiError):
            EsiClient().get("/status/")
        cache.set("k", "demo")
    assert sent == [] and cache.get("k") is None
    update_market_prices.delay()
    assert sent == [update_market_prices.name]
