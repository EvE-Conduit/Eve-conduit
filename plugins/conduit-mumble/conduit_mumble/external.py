"""Mounted at /api/v1/p/mumble/ for the authenticator that runs next to the Mumble server (API key with
``p.mumble:auth``; switch the Mumble API on under Administration → API first).

The authenticator sends every login attempt here and gets back whether to let the person in, as whom and in which
groups. The password never gets stored on the Mumble server and never leaves this site's database.
"""

from ninja import Router, Schema
from ninja.errors import HttpError

from conduit.external.auth import require_scope

from . import services
from .models import MumbleSettings

router = Router(tags=["mumble (authenticator)"])


class AuthIn(Schema):
    name: str
    password: str = ""
    #: SHA-1 of the client certificate, as Mumble passes it, if there is one.
    certhash: str = ""
    strong: bool = False
    #: The authenticator's version, shown under Setup.
    version: str = ""


@router.post("/authenticate")
@require_scope("p.mumble:auth")
def authenticate(request, payload: AuthIn):
    """``result`` is ``ok`` (with ``id``, ``name`` and ``groups``), ``reject`` or ``fallthrough`` (not a name this
    site knows; let the server decide, so SuperUser keeps working)."""
    return services.authenticate(payload.name, payload.password, payload.certhash, payload.strong, payload.version)


@router.get("/users/{int:mumble_id}")
@require_scope("p.mumble:auth")
def user(request, mumble_id: int):
    info = services.user_info(mumble_id)
    if info is None:
        raise HttpError(404, "No such Mumble user")
    return info


@router.get("/users/by-name")
@require_scope("p.mumble:auth")
def by_name(request, name: str):
    mumble_id = services.name_to_id(name)
    if mumble_id is None:
        raise HttpError(404, "No such Mumble user")
    return {"id": mumble_id}


class PingIn(Schema):
    version: str = ""


@router.post("/ping")
@require_scope("p.mumble:auth")
def ping(request, payload: PingIn):
    """The authenticator says hello when it starts and every few minutes, so Setup can show it's running."""
    s = MumbleSettings.load()
    services._seen(s, payload.version)
    return {"ok": True, "configured": s.configured, "cert_auth": s.allow_cert_auth}
