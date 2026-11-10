"""The draw, without the database: one random cycle through everyone, so nobody gets themselves, nobody gets someone
they're kept apart from, and taking one person out later never leaves anyone giving to themselves.

People are any hashable ids; ``apart`` holds pairs (as frozensets) who must not give to each other either way round.
"""

from __future__ import annotations

import secrets
from collections.abc import Hashable, Iterable, Mapping

MIN_PEOPLE = 3
#: Plain shuffles tried before searching. With a few exclusions in a big group nearly every shuffle works, and a
#: shuffle that works is as likely as any other valid draw.
SHUFFLES = 500
#: Steps the search may take before giving up.
BUDGET = 200_000

_rng = secrets.SystemRandom()


class DrawError(Exception):
    pass


def _allowed(people: list, apart: set[frozenset]) -> dict:
    return {p: {q for q in people if q != p and frozenset((p, q)) not in apart} for p in people}


def _fits(order: list, apart: set[frozenset]) -> bool:
    return all(frozenset((order[i], order[(i + 1) % len(order)])) not in apart for i in range(len(order)))


def _search(people: list, allowed: dict, rng, budget: int) -> list | None:
    """Backtracking for a cycle through everyone. ``None`` when there is none; raises when it ran out of steps."""
    start = people[0]
    path, used = [start], {start}
    stack = [iter(rng.sample(sorted(allowed[start], key=str), len(allowed[start])))]
    steps = 0
    while stack:
        steps += 1
        if steps > budget:
            raise TimeoutError
        nxt = next(stack[-1], None)
        if nxt is None:
            stack.pop()
            used.discard(path.pop())
            continue
        if nxt in used:
            continue
        path.append(nxt)
        used.add(nxt)
        if len(path) == len(people):
            if start in allowed[nxt]:
                return path
            used.discard(path.pop())
            continue
        options = [q for q in allowed[nxt] if q not in used]
        stack.append(iter(rng.sample(options, len(options))))
    return None


def draw(people: Iterable[Hashable], apart: Iterable[frozenset] = (), names: Mapping | None = None, *, rng=None,
         budget: int = BUDGET) -> dict:
    """``{giver: giftee}`` for everyone, as one cycle. Raises ``DrawError`` saying why when it can't be done."""
    rng = rng or _rng
    people = list(dict.fromkeys(people))
    apart = {frozenset(p) for p in apart}
    names = names or {}
    name = lambda p: names.get(p, str(p))  # noqa: E731
    if len(people) < MIN_PEOPLE:
        raise DrawError(f"A draw needs at least {MIN_PEOPLE} people; {len(people)} signed up.")
    allowed = _allowed(people, apart)
    # In a cycle everyone gives to one person and gets from another, so each needs two people they may be paired with.
    stuck = [p for p in people if len(allowed[p]) < 2]
    if stuck:
        parts = []
        for p in stuck:
            left = sorted(allowed[p], key=str)
            parts.append(f"{name(p)} can only be paired with {name(left[0])}" if left else f"{name(p)} is kept apart from everyone")
        raise DrawError("These exclusions leave someone without enough people to pair with: " + "; ".join(parts)
                        + ". Everyone needs at least two people they may give to or get from. Remove some exclusions.")
    order = list(people)
    for _ in range(SHUFFLES):
        rng.shuffle(order)
        if _fits(order, apart):
            return _pairs(order)
    rng.shuffle(order)
    try:
        found = _search(order, allowed, rng, budget)
    except TimeoutError:
        raise DrawError("No draw fitting these exclusions was found in time. Remove some exclusions and try again.") from None
    if found is None:
        raise DrawError("There's no way to draw with these exclusions: they leave no single chain through everyone. "
                        "Remove some exclusions and try again.")
    return _pairs(found)


def _pairs(order: list) -> dict:
    return {order[i]: order[(i + 1) % len(order)] for i in range(len(order))}


def repair(pairs: Mapping, removed: Hashable, apart: Iterable[frozenset] = (), names: Mapping | None = None) -> tuple:
    """Take ``removed`` out of a stored draw: whoever gave to them now gives to their giftee. Returns
    ``(giver, new giftee)``. Raises ``DrawError`` when that would pair someone with themselves or with someone they're
    kept apart from."""
    names = names or {}
    name = lambda p: names.get(p, str(p))  # noqa: E731
    giftee = pairs[removed]
    giver = next(g for g, r in pairs.items() if r == removed)
    if giver == giftee:
        raise DrawError("Only two people would be left, who'd just give to each other. End the event instead.")
    if frozenset((giver, giftee)) in {frozenset(p) for p in apart}:
        raise DrawError(f"Taking {name(removed)} out would make {name(giver)} give to {name(giftee)}, but they are kept "
                        "apart. Remove that exclusion first.")
    return giver, giftee
