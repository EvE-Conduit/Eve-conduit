from datetime import timedelta

import pytest
from django.utils import timezone

from evecsm.accounts.models import Character, Token, User
from evecsm.eve.models import EveAlliance, EveCorporation


@pytest.fixture(autouse=True)
def _clear_cache():
    from django.core.cache import cache

    cache.clear()
    yield
    cache.clear()


@pytest.fixture(autouse=True)
def _no_affiliation_calls(monkeypatch):
    """Linking a character queues an ESI affiliation update; keep tests offline."""
    from evecsm.eve import tasks

    monkeypatch.setattr(tasks.update_affiliations, "delay", lambda *a, **k: None)
    from evecsm.sheet import tasks as sheet_tasks

    monkeypatch.setattr(sheet_tasks.sync_section, "delay", lambda *a, **k: None)


@pytest.fixture
def corp(db):
    alliance = EveAlliance.objects.create(id=99000001, name="Test Alliance", ticker="TEST")
    return EveCorporation.objects.create(id=98000001, name="Test Corp", ticker="TCORP", alliance=alliance)


def make_user(char_id=90000001, name="Pilot One", corporation=None, scopes="publicData"):
    user = User.objects.create(username=f"char_{char_id}")
    char = Character.objects.create(
        id=char_id,
        name=name,
        owner_hash=f"hash-{char_id}",
        user=user,
        corporation=corporation,
        alliance=corporation.alliance if corporation else None,
    )
    Token.objects.create(
        character=char,
        access_token="access",
        refresh_token="refresh",
        expires_at=timezone.now() + timedelta(minutes=20),
        scopes=scopes,
    )
    user.main_character = char
    user.save()
    return user


@pytest.fixture
def user(db):
    return make_user()


@pytest.fixture
def admin_user(db):
    u = make_user(90000099, "Admin Pilot")
    u.is_superuser = True
    u.save()
    return u


@pytest.fixture
def api_client(client):
    """Django test client that sends JSON and passes CSRF like the web UI does."""
    from django.test import Client

    c = Client(enforce_csrf_checks=True)
    c.get("/api/core/bootstrap")

    def call(method, path, data=None):
        kwargs = {"content_type": "application/json", "HTTP_X_CSRFTOKEN": c.cookies["csrftoken"].value}
        if data is not None:
            kwargs["data"] = data
        return getattr(c, method)(path, **kwargs)

    c.call = call
    return c


@pytest.fixture(autouse=True)
def _public_dns(monkeypatch):
    """Webhook URLs are resolved to refuse internal addresses; keep tests offline with a public answer
    unless a test patches resolution itself."""
    import socket

    real = socket.getaddrinfo

    def fake(host, port, *args, **kwargs):
        if host.endswith((".example", ".example.com")) or host in {"example.com", "discord.example", "hooks.example"}:
            return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", port))]
        return real(host, port, *args, **kwargs)

    monkeypatch.setattr("evecsm.events.safety.socket.getaddrinfo", fake)
