"""Keep webhooks pointed at the internet, not at the server's own network.

An admin-supplied URL is a way to make the server send requests on someone's behalf. Hosts that resolve to
private, loopback, link-local (cloud metadata), reserved or multicast addresses are refused, both when the
webhook is saved and again right before every delivery (DNS can change in between).

``CONDUIT_WEBHOOK_ALLOW_PRIVATE=true`` lifts this for installs that deliberately post to internal services.
"""

from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlsplit

from django.conf import settings


class UnsafeUrl(ValueError):
    pass


def _bad(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
        ip = ip.ipv4_mapped
    return not ip.is_global or ip.is_multicast


def check_url(url: str) -> None:
    """Raise UnsafeUrl unless ``url`` is https:// to a host that only resolves to public addresses."""
    parts = urlsplit(url)
    if parts.scheme != "https" or not parts.hostname:
        raise UnsafeUrl("webhook URLs must start with https://")
    if parts.username or parts.password:
        raise UnsafeUrl("webhook URLs can't contain a user name or password")
    if getattr(settings, "CONDUIT_WEBHOOK_ALLOW_PRIVATE", False):
        return
    host = parts.hostname
    try:
        literal = ipaddress.ip_address(host)
    except ValueError:
        literal = None
    if literal is not None:
        addresses = [literal]
    else:
        if host == "localhost" or host.endswith((".localhost", ".local", ".internal")):
            raise UnsafeUrl("webhooks can't point at the server's own network")
        try:
            infos = socket.getaddrinfo(host, parts.port or 443, proto=socket.IPPROTO_TCP)
        except socket.gaierror:
            raise UnsafeUrl(f"{host} could not be found") from None
        addresses = [ipaddress.ip_address(info[4][0].split("%")[0]) for info in infos]
    if not addresses or any(_bad(a) for a in addresses):
        raise UnsafeUrl("webhooks can't point at private, loopback or internal addresses")
