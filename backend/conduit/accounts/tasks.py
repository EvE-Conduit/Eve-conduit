"""Background work for accounts: checking tokens brought over from SeAT."""

import logging
from concurrent.futures import ThreadPoolExecutor

from celery import shared_task
from django.core.cache import cache
from django.db import close_old_connections

log = logging.getLogger(__name__)

#: How long a check's results stay readable through the API.
RESULT_TTL = 24 * 3600
#: Refreshes in flight at once; EVE SSO copes with this easily and 1,000 tokens take about a minute.
PARALLEL = 8


def verify_key(run_id: str) -> str:
    return f"conduit:seat-import:verify:{run_id}"


@shared_task
def verify_seat_tokens(run_id: str, character_ids: list[int]):
    """Refresh each imported token once. EVE answers with a new token (saved) or refuses it, in which case the
    token is marked invalid and the owner is asked to log in again, as for any other lost token."""
    from conduit.esi.exceptions import TokenInvalid
    from conduit.esi.tokens import get_access_token
    from conduit.eve.tasks import update_affiliations

    from .models import Character

    state = {"total": len(character_ids), "done": 0, "live": 0, "dead": [], "errors": [], "finished": False}
    cache.set(verify_key(run_id), state, RESULT_TTL)

    def check(char_id: int):
        try:
            character = Character.objects.get(pk=char_id)
            try:
                get_access_token(character)
                return char_id, "live", ""
            except TokenInvalid:
                return char_id, "dead", character.name
        except Exception as exc:  # network trouble etc.: report it, the token is left as it was
            log.warning("Checking the imported token of %s failed: %s", char_id, exc)
            return char_id, "error", str(exc)[:200]

    def check_in_thread(char_id: int):
        close_old_connections()
        try:
            return check(char_id)
        finally:
            close_old_connections()

    pool = ThreadPoolExecutor(PARALLEL) if PARALLEL > 1 else None
    try:
        outcomes = pool.map(check_in_thread, character_ids) if pool else map(check, character_ids)
        for char_id, outcome, detail in outcomes:
            state["done"] += 1
            if outcome == "live":
                state["live"] += 1
            elif outcome == "dead":
                state["dead"].append({"id": char_id, "name": detail})
            else:
                state["errors"].append({"id": char_id, "error": detail})
            if state["done"] % 25 == 0:
                cache.set(verify_key(run_id), state, RESULT_TTL)
    finally:
        if pool:
            pool.shutdown()

    state["finished"] = True
    cache.set(verify_key(run_id), state, RESULT_TTL)
    # Corporations and alliances (and so states) for everyone imported.
    update_affiliations.delay(character_ids)
    return {k: v for k, v in state.items() if k != "dead"} | {"dead": len(state["dead"])}
