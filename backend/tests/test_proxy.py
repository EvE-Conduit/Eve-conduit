"""Forwarded headers are only believed from a trusted proxy (CONDUIT_TRUSTED_PROXIES)."""

from ipaddress import ip_network

import pytest
from django.test import override_settings

from conduit.audit.models import AuditEvent
from conduit.settings import trusted_proxy_networks


def logged_ip(api_client, user, **meta) -> str:
    """The address the audit log saw for a request sent with these WSGI variables."""
    api_client.force_login(user)
    assert api_client.post("/api/core/logout", content_type="application/json",
                           HTTP_X_CSRFTOKEN=api_client.cookies["csrftoken"].value, **meta).status_code == 200
    return AuditEvent.objects.filter(action="auth.logout").latest("id").ip


@pytest.mark.django_db
def test_trusted_proxy_forwarded_for_gives_the_last_hop(user, api_client):
    # The test client connects from 127.0.0.1, which is trusted by default; the proxy appends the real client last.
    assert logged_ip(api_client, user, HTTP_X_FORWARDED_FOR="1.1.1.1, 203.0.113.9") == "203.0.113.9"


@pytest.mark.django_db
def test_untrusted_peer_forwarded_for_is_ignored(user, api_client):
    assert logged_ip(api_client, user, REMOTE_ADDR="198.51.100.7", HTTP_X_FORWARDED_FOR="203.0.113.9") == "198.51.100.7"


@pytest.mark.django_db
@override_settings(CONDUIT_TRUSTED_PROXIES=[ip_network("172.16.0.0/12")])
def test_docker_bridge_peer_can_be_trusted(user, api_client):
    assert logged_ip(api_client, user, REMOTE_ADDR="172.18.0.3", HTTP_X_FORWARDED_FOR="203.0.113.9") == "203.0.113.9"
    assert logged_ip(api_client, user, REMOTE_ADDR="127.0.0.1", HTTP_X_FORWARDED_FOR="203.0.113.9") == "127.0.0.1"


@pytest.mark.django_db
def test_forwarded_proto_only_counts_from_a_trusted_proxy(client, settings):
    """A visitor saying X-Forwarded-Proto: https must not make the app think the connection is secure."""
    settings.SESSION_COOKIE_SECURE = True
    assert client.get("/sso/login", REMOTE_ADDR="198.51.100.7", HTTP_X_FORWARDED_PROTO="https")["Location"] == "/login?error=insecure"
    assert client.get("/sso/login", HTTP_X_FORWARDED_PROTO="https")["Location"].startswith("https://login.eveonline.com/")


def test_trusted_proxy_defaults():
    assert trusted_proxy_networks("", "baremetal") == [ip_network("127.0.0.0/8"), ip_network("::1/128")]
    docker = trusted_proxy_networks("", "docker")
    assert ip_network("172.16.0.0/12") in docker and ip_network("10.0.0.0/8") in docker and ip_network("fd00::/8") in docker
    # Set explicitly, the list replaces the default (also on Docker), and a bare address is fine.
    assert trusted_proxy_networks("10.1.2.3, 192.0.2.0/24", "docker") == [ip_network("10.1.2.3/32"), ip_network("192.0.2.0/24")]
