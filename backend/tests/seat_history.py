"""Helpers for the SeAT history import tests: SeAT dumps written from plain rows."""

from pathlib import Path

from conduit.sheet.seat import history


def _sql(value) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, (int, float)):
        return repr(value)
    text = str(value).replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t")
    return f"'{text}'"


def write_dump(path: Path, tables: dict[str, list[dict]]) -> Path:
    """A mariadb-dump style file with these tables. Columns come from the rows' keys, in first-seen order."""
    lines = ["-- MariaDB dump 10.19  Distrib 10.11.19-MariaDB", "/*!40101 SET NAMES utf8mb4 */;"]
    for name, rows in tables.items():
        cols: list[str] = []
        for row in rows:
            cols += [c for c in row if c not in cols]
        lines.append(f"CREATE TABLE `{name}` (")
        lines += [f"  `{c}` text DEFAULT NULL," for c in cols]
        lines.append(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;")
        if rows:
            values = ",".join("(" + ",".join(_sql(r.get(c)) for c in cols) + ")" for r in rows)
            lines.append(f"INSERT INTO `{name}` VALUES {values};")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


def token_row(character_id, user_id=1, updated_at="2025-03-01 12:00:00", deleted_at=None):
    return {"character_id": character_id, "user_id": user_id, "refresh_token": "rt", "scopes": "[]",
            "character_owner_hash": f"hash-{character_id}", "created_at": "2020-01-01 00:00:00",
            "updated_at": updated_at, "deleted_at": deleted_at}


def run(path: Path, **kwargs) -> dict:
    said = []
    kwargs.setdefault("lookup_names", False)
    summary = history.run(str(path), say=said.append, **kwargs)
    summary["said"] = said
    return summary
