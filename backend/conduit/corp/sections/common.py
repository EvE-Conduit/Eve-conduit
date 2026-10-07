from decimal import Decimal

from conduit.sheet.util import parse_dt  # noqa: F401  (re-exported for the section modules)


def dec(value):
    return None if value is None else Decimal(str(value))


def has(character, scope: str) -> bool:
    return bool(character and character.token.has_scopes(scope))
