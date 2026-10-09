"""A SeAT dump loaded into a throwaway SQLite file, so each character's rows can be looked up quickly.

A full SeAT dump runs to several GB, mostly wallet journals and assets. It streams into SQLite once (only the
tables the history import reads), then the import asks for one character's rows at a time.
"""

from __future__ import annotations

import sqlite3
from collections.abc import Callable, Iterable

from .dump import iter_rows

#: Rows per insert batch while loading.
BATCH = 5000


def _q(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


class Staging:
    def __init__(self, path: str):
        self.path = path
        self.db = sqlite3.connect(path)
        self.db.row_factory = sqlite3.Row
        self.db.execute("PRAGMA journal_mode = OFF")
        self.db.execute("PRAGMA synchronous = OFF")
        self.columns: dict[str, list[str]] = {
            r["name"]: [c[1] for c in self.db.execute(f"PRAGMA table_info({_q(r['name'])})")]
            for r in self.db.execute("SELECT name FROM sqlite_master WHERE type = 'table'")
        }

    def close(self):
        self.db.close()

    # --- loading --------------------------------------------------------------------------------------------

    def load(self, dump_path: str, tables: Iterable[str], indexes: dict[str, Iterable[str]],
             progress: Callable[[str, int], None] | None = None) -> dict[str, int]:
        """Copy the wanted tables' rows out of the dump. Returns rows loaded per table."""
        wanted = set(tables)
        dump_columns: dict[str, list[str]] = {}
        pending: dict[str, list[tuple]] = {}
        counts: dict[str, int] = {}

        def flush(name: str):
            rows = pending.pop(name, [])
            if rows:
                cols = self.columns[name]
                self.db.executemany(f"INSERT INTO {_q(name)} VALUES ({', '.join('?' * len(cols))})", rows)

        for name, row in iter_rows(dump_path, wanted, dump_columns):
            if name not in self.columns:
                cols = list(row)
                self.db.execute(f"DROP TABLE IF EXISTS {_q(name)}")
                self.db.execute(f"CREATE TABLE {_q(name)} ({', '.join(_q(c) for c in cols)})")
                self.columns[name] = cols
            batch = pending.setdefault(name, [])
            batch.append(tuple(row.get(c) for c in self.columns[name]))
            counts[name] = counts.get(name, 0) + 1
            if len(batch) >= BATCH:
                flush(name)
                if progress:
                    progress(name, counts[name])
        for name in list(pending):
            flush(name)
        for name, cols in indexes.items():
            for col in cols:
                if name in self.columns and col in self.columns[name]:
                    self.db.execute(f"CREATE INDEX IF NOT EXISTS {_q(f'ix_{name}_{col}')} ON {_q(name)} ({_q(col)})")
        self.db.commit()
        return counts

    # --- reading --------------------------------------------------------------------------------------------

    def has(self, table: str) -> bool:
        return table in self.columns

    def rows(self, table: str, order: str = "", **where) -> list[dict]:
        """Rows of ``table`` matching every ``column=value``; [] if the dump didn't have the table."""
        if table not in self.columns:
            return []
        sql = f"SELECT * FROM {_q(table)}"
        if where:
            sql += " WHERE " + " AND ".join(f"{_q(k)} = ?" for k in where)
        if order:
            sql += f" ORDER BY {order}"
        return [dict(r) for r in self.db.execute(sql, tuple(where.values()))]

    def one(self, table: str, **where) -> dict | None:
        found = self.rows(table, **where)
        return found[0] if found else None

    def rows_in(self, table: str, column: str, values: Iterable) -> list[dict]:
        """Rows whose ``column`` is any of ``values``."""
        values = list(values)
        if table not in self.columns or not values:
            return []
        out = []
        for i in range(0, len(values), 500):
            chunk = values[i:i + 500]
            sql = f"SELECT * FROM {_q(table)} WHERE {_q(column)} IN ({', '.join('?' * len(chunk))})"
            out += [dict(r) for r in self.db.execute(sql, chunk)]
        return out

    def character_ids(self) -> set[int]:
        """Every character SeAT held a token for (live or not)."""
        return {r[0] for r in self.db.execute("SELECT character_id FROM refresh_tokens")} if self.has("refresh_tokens") else set()
