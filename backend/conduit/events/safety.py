"""Keep webhooks pointed at the internet, not at the server's own network.

An admin-supplied URL is a way to make the server send requests on someone's behalf. Hosts that resolve to
private, loopback, link-local (cloud metadata), reserved or multicast addresses are refused, both when the
webhook is saved and again right before every delivery (DNS can change in between). The delivery then connects
to the very address that was checked (``pin``), so a name that answers differently a moment later gets nowhere.

``CONDUIT_WEBHOOK_ALLOW_PRIVATE=true`` lifts this for installs that deliberately post to internal services.
"""

from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlsplit, urlunsplit

from django.conf import settings

Address = ipaddress.IPv4Address | ipaddress.IPv6Address

#: IPv6 ranges that carry an IPv4 address in their last 32 bits: NAT64 (RFC 6052) and IPv4-translated (RFC 2765).
#: The IPv4 inside is what the packet reaches, so it is the one to judge (like ``::ffff:a.b.c.d``).
_EMBEDDED_IPV4 = (ipaddress.IPv6Network("64:ff9b::/96"), ipaddress.IPv6Network("::ffff:0:0:0/96"))


class UnsafeUrl(ValueError):
    pass


def _bad(ip: Address) -> bool:
    if isinstance(ip, ipaddress.IPv6Address):
        if ip.ipv4_mapped:
            ip = ip.ipv4_mapped
        elif any(ip in net for net in _EMBEDDED_IPV4):
            ip = ipaddress.IPv4Address(int(ip) & 0xFFFFFFFF)
    return not ip.is_global or ip.is_multicast


def check_url(url: str) -> list[Address]:
    """Raise UnsafeUrl unless ``url`` is https:// to a host that only resolves to public addresses. Returns the
    addresses it resolved to, for ``pin`` ([] when private addresses are allowed: connect as usual)."""
    parts = urlsplit(url)
    if parts.scheme != "https" or not parts.hostname:
        raise UnsafeUrl("webhook URLs must start with https://")
    if parts.username or parts.password:
        raise UnsafeUrl("webhook URLs can't contain a user name or password")
    if getattr(settings, "CONDUIT_WEBHOOK_ALLOW_PRIVATE", False):
        return []
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
    return addresses


def pin(url: str, addresses: list[Address]) -> tuple[str, dict[str, str], dict[str, str]]:
    """How to send a request to ``url`` at one of the ``addresses`` ``check_url`` vetted, without looking the name
    up again: (URL with the address in place of the host name, headers, httpx extensions). The ``Host`` header and
    the TLS server name (``sni_hostname``) stay the real host name, so the certificate is still checked against it.
    """
    parts = urlsplit(url)
    host = parts.hostname or ""
    try:
        ipaddress.ip_address(host)
        return url, {}, {}  # already an address: nothing to look up
    except ValueError:
        pass
    if not addresses:
        return url, {}, {}
    ip = addresses[0]
    literal = f"[{ip}]" if ip.version == 6 else str(ip)
    netloc = literal + (f":{parts.port}" if parts.port else "")
    return urlunsplit(parts._replace(netloc=netloc)), {"Host": parts.netloc}, {"sni_hostname": host}
