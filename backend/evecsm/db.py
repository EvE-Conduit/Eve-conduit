"""Database helpers that work the same on PostgreSQL, MariaDB/MySQL and SQLite."""

from django.db import connections, router


def upsert(model, objs, *, unique_fields: list[str], update_fields: list[str], batch_size: int | None = None):
    """Insert rows, updating ``update_fields`` on rows that already exist.

    PostgreSQL and SQLite need the conflicting columns spelled out; MariaDB and
    MySQL refuse them and use every unique index instead (``ON DUPLICATE KEY``).
    """
    connection = connections[router.db_for_write(model)]
    kwargs = {"update_conflicts": True, "update_fields": update_fields, "batch_size": batch_size}
    if connection.features.supports_update_conflicts_with_target:
        kwargs["unique_fields"] = unique_fields
    return model.objects.bulk_create(objs, **kwargs)
