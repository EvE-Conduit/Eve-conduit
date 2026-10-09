"""Writing a fresh copy of a list ESI hands over whole (assets, blueprints, skills) without rewriting all of it."""

from __future__ import annotations

from django.db import models


def replace_rows(existing: models.QuerySet, rows, key: str, fields: list[str]) -> tuple[int, int, int]:
    """Make ``existing`` hold exactly ``rows`` (unsaved instances), matched on ``key``: insert new ones, update
    the ones whose ``fields`` changed, delete the ones that are gone.

    Deleting everything and inserting it again would leave Postgres a dead row for every row on every sync;
    most of a character's assets don't change between syncs, so this mostly writes nothing.
    Returns (created, updated, deleted). Call it inside a transaction.
    """
    current = {row[0]: (row[1], row[2:]) for row in existing.values_list(key, "pk", *fields)}
    seen, create, update = set(), [], []
    for obj in rows:
        k = getattr(obj, key)
        seen.add(k)
        found = current.get(k)
        if found is None:
            create.append(obj)
        elif tuple(getattr(obj, f) for f in fields) != found[1]:
            obj.pk = found[0]
            update.append(obj)
    gone = [pk for k, (pk, _) in current.items() if k not in seen]
    model = existing.model
    for i in range(0, len(gone), 1000):
        model.objects.filter(pk__in=gone[i : i + 1000]).delete()
    if update:
        model.objects.bulk_update(update, fields, batch_size=500)
    if create:
        model.objects.bulk_create(create, batch_size=2000)
    return len(create), len(update), len(gone)
