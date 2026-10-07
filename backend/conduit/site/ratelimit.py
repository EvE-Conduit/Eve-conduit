"""Simple per-IP rate limits for the endpoints people (or scripts) could hammer.

Limits live in the cache (Redis in production), so they apply across every web process. Switch off with
CONDUIT_RATE_LIMITS=false if the proxy in front already limits these paths.
"""

from __future__ import annotations

import time
from dataclasses import dataclass

from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponse, JsonResponse

from conduit.audit.services import client_ip


@dataclass(frozen=True)
class Limit:
    name: str
    prefixes: tuple[str, ...]
    limit: int
    window: int  # seconds
    methods: tuple[str, ...] = ()
    #: Only count responses with these status codes (e.g. failed API-key logins); empty counts every request.
    count_statuses: tuple[int, ...] = ()


LIMITS = (
    Limit("sso", ("/sso/login", "/sso/add-character", "/sso/callback"), limit=40, window=300),
    Limit("setup-claim", ("/api/setup/claim",), limit=5, window=900, methods=("POST",)),
    Limit("api-key-failures", ("/api/v1/",), limit=30, window=600, count_statuses=(401,)),
)


def _key(limit: Limit, ip: str) -> str:
    return f"conduit:ratelimit:{limit.name}:{ip}:{int(time.time() // limit.window)}"


def _count(key: str, window: int) -> int:
    if cache.add(key, 1, window + 5):
        return 1
    try:
        return cache.incr(key)
    except ValueError:  # expired between add and incr
        cache.set(key, 1, window + 5)
        return 1


class RateLimitMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not settings.CONDUIT_RATE_LIMITS:
            return self.get_response(request)
        path = request.path
        matched = [l for l in LIMITS if path.startswith(l.prefixes) and (not l.methods or request.method in l.methods)]
        if not matched:
            return self.get_response(request)
        ip = client_ip(request) or "unknown"
        for limit in matched:
            key = _key(limit, ip)
            used = cache.get(key, 0) if limit.count_statuses else _count(key, limit.window)
            if used > limit.limit or (limit.count_statuses and used >= limit.limit):
                return _too_many(request, limit)
        response = self.get_response(request)
        for limit in matched:
            if limit.count_statuses and response.status_code in limit.count_statuses:
                _count(_key(limit, ip), limit.window)
        return response


def _too_many(request, limit: Limit):
    retry = str(limit.window - int(time.time()) % limit.window)
    message = "Too many attempts from your address. Please wait a few minutes and try again."
    if request.path.startswith("/api/"):
        response = JsonResponse({"detail": message}, status=429)
    else:
        response = HttpResponse(message, status=429, content_type="text/plain")
    response["Retry-After"] = retry
    return response
