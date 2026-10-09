"""Mining: the whole mining ledger SeAT kept. EVE only serves the last 30 days.

SeAT stores what each fetch added to a day as its own row (date + time); ESI gives one total per day, system and
type, so the rows are summed back into those totals.
"""

from conduit.sheet.mining.models import MiningEntry

from ..esi import route
from . import HISTORY, section

section("mining", HISTORY, ["character_minings"])


@route("/characters/{cid}/mining")
def ledger(ctx, params, cid):
    totals: dict[tuple, int] = {}
    for r in ctx.store.rows("character_minings", character_id=cid):
        if not r["date"]:
            continue
        key = (str(r["date"])[:10], int(r["solar_system_id"]), int(r["type_id"]))
        totals[key] = totals.get(key, 0) + int(r["quantity"])
    if ctx.synced:  # the sync overwrites a day's quantity; keep the days EVE already gave as they are
        have = {(d.isoformat(), s, t) for d, s, t in
                MiningEntry.objects.filter(character_id=cid).values_list("date", "solar_system_id", "type_id")}
        totals = {k: v for k, v in totals.items() if k not in have}
    return [{"date": d, "solar_system_id": s, "type_id": t, "quantity": q} for (d, s, t), q in sorted(totals.items())]
