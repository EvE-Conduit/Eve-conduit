"""Shapes shared between API routers."""

from ninja import Schema

from conduit.eve.models import alliance_logo_url, corporation_logo_url, portrait_url


class EntityOut(Schema):
    id: int
    name: str
    ticker: str = ""
    logo: str


class CharacterBrief(Schema):
    id: int
    name: str
    portrait: str
    corporation: EntityOut | None = None
    alliance: EntityOut | None = None


def corp_out(corp) -> dict | None:
    if corp is None:
        return None
    return {"id": corp.id, "name": corp.name, "ticker": corp.ticker, "logo": corporation_logo_url(corp.id)}


def alliance_out(alliance) -> dict | None:
    if alliance is None:
        return None
    return {"id": alliance.id, "name": alliance.name, "ticker": alliance.ticker, "logo": alliance_logo_url(alliance.id)}


def character_brief(char) -> dict | None:
    if char is None:
        return None
    return {
        "id": char.id,
        "name": char.name,
        "portrait": portrait_url(char.id, 256),
        "corporation": corp_out(char.corporation),
        "alliance": alliance_out(char.alliance),
    }


class StateBrief(Schema):
    id: int
    name: str
    color: str


class ErrorOut(Schema):
    detail: str
