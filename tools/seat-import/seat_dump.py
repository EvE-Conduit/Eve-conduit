"""Reading rows out of a SQL dump of SeAT's database, without a database server. Standard library only.

Reads mariadb-dump / mysqldump output and the exports of phpMyAdmin, HeidiSQL and similar tools: statements may
span lines, inserts may name their columns, and the file may be UTF-8 or UTF-16. Tables nobody asked for are
skipped without being parsed, so a full dump of several GB streams through in one pass.

Two identical copies exist: tools/seat-import/seat_dump.py (the import program) and
backend/conduit/sheet/seat/dump.py (Conduit's history import). A test keeps them identical; edit both.
"""

from __future__ import annotations

import os
import re

_ESCAPES = {"0": "\0", "b": "\b", "n": "\n", "r": "\r", "t": "\t", "Z": "\x1a"}
_CREATE = re.compile(r"CREATE TABLE (?:IF NOT EXISTS )?(?:`[^`]+`\.)?`([^`]+)`", re.I)
_INSERT = re.compile(r"(?:INSERT|REPLACE)(?: IGNORE)? INTO (?:`[^`]+`\.)?`([^`]+)`\s*(\([^)]*\))?\s*VALUES\s*", re.I)
_COLUMN = re.compile(r"\s*`([^`]+)`\s")


class DumpError(Exception):
    """The dump can't be read; the message says why and, where it can, at which line."""


def sql_values(text: str, start: int = 0):
    """The rows of one ``INSERT ... VALUES (...),(...);`` statement, as lists of str, int, float or None."""
    i, n = start, len(text)
    while i < n:
        while i < n and text[i] in " \t\r\n,":
            i += 1
        if i >= n or text[i] == ";":
            return
        if text[i] != "(":
            raise ValueError(f"unexpected {text[i:i + 20]!r}")
        i += 1
        row = []
        while True:
            while text[i] in " \t\r\n":
                i += 1
            if text.startswith("_binary ", i):
                i += 8
            if text[i] == "'":
                i += 1
                out = []
                while True:
                    c = text[i]
                    if c == "\\":
                        nxt = text[i + 1]
                        out.append(_ESCAPES.get(nxt, nxt))
                        i += 2
                    elif c == "'":
                        if text.startswith("''", i):  # a doubled quote is one quote
                            out.append("'")
                            i += 2
                        else:
                            i += 1
                            break
                    else:
                        j = i
                        while text[j] not in "\\'":
                            j += 1
                        out.append(text[i:j])
                        i = j
                row.append("".join(out))
            else:
                j = i
                while text[j] not in ",)":
                    j += 1
                raw = text[i:j].strip()
                i = j
                if raw.upper() == "NULL":
                    row.append(None)
                elif raw.lower().startswith("0x"):
                    row.append(bytes.fromhex(raw[2:]).decode("utf-8", "replace"))
                else:
                    try:
                        row.append(int(raw))
                    except ValueError:
                        row.append(float(raw))
            while text[i] in " \t\r\n":
                i += 1
            if text[i] == ",":
                i += 1
                continue
            i += 1  # the closing parenthesis
            yield row
            break


def open_dump(path: str):
    """Text of a dump in whatever encoding it was saved in (PowerShell's > writes UTF-16)."""
    try:
        with open(path, "rb") as fh:
            head = fh.read(4)
        encoding = "utf-16" if head[:2] in (b"\xff\xfe", b"\xfe\xff") else "utf-8-sig"
        return open(path, encoding=encoding, errors="replace", newline="")
    except OSError as exc:
        raise DumpError(f"Could not open {path}: {exc.strerror}") from None


def iter_rows(path: str, tables=None, columns: dict | None = None):
    """``(table, row)`` for every row of the wanted tables (all tables when ``tables`` is None), each row a dict
    by column name, in file order. ``columns`` (a dict), if given, collects each table's column names."""
    wanted = None if tables is None else set(tables)
    columns = {} if columns is None else columns
    creating = None  # table whose column list is being read
    inserting = None  # (table, column names, first line number, lines so far) of a statement spanning lines

    def rows_of(name, names, text, line_no):
        if not names:
            raise DumpError(f"Line {line_no}: the dump inserts into {name} before defining it. Dump with the "
                            "table definitions (CREATE TABLE) included.")
        try:
            for row in sql_values(text):
                yield name, dict(zip(names, row))
        except (ValueError, IndexError) as exc:
            raise DumpError(f"Line {line_no}: could not read the {name} rows ({exc}).") from None

    with open_dump(path) as fh:
        for line_no, line in enumerate(fh, 1):
            line = line.rstrip("\r\n")
            if inserting is not None:
                inserting[3].append(line)
                if line.rstrip().endswith(";"):
                    name, names, first, parts = inserting
                    inserting = None
                    yield from rows_of(name, names, "\n".join(parts), first)
                continue
            if creating is not None:
                stripped = line.lstrip()
                if stripped.startswith(")"):
                    creating = None
                elif stripped.startswith("`"):
                    m = _COLUMN.match(line)
                    if m:
                        columns[creating].append(m.group(1))
                continue
            m = _CREATE.match(line)
            if m:
                if wanted is None or m.group(1) in wanted:
                    creating = m.group(1)
                    columns[creating] = []
                continue
            m = _INSERT.match(line)
            if not m or (wanted is not None and m.group(1) not in wanted):
                continue
            name = m.group(1)
            names = columns.get(name)
            if m.group(2):  # the insert names its columns
                names = [c.strip(" `\t") for c in m.group(2)[1:-1].split(",")]
                columns.setdefault(name, names)
            rest = line[m.end():]
            if rest.rstrip().endswith(";"):
                yield from rows_of(name, names, rest, line_no)
            else:
                inserting = (name, names, line_no, [rest])
    if inserting is not None:
        yield from rows_of(inserting[0], inserting[1], "\n".join(inserting[3]), inserting[2])


def read_tables(path: str, tables, required=("users", "refresh_tokens")) -> dict[str, list[dict]]:
    """All rows of the wanted tables, by table. Fails if a ``required`` table isn't in the dump at all."""
    out: dict[str, list[dict]] = {t: [] for t in tables}
    columns: dict[str, list[str]] = {}
    for name, row in iter_rows(path, tables, columns):
        out[name].append(row)
    missing = [t for t in required if t not in columns]
    if missing:
        raise DumpError(f"{os.path.basename(path)} has no {' or '.join(missing)} table. Is it a dump of SeAT's "
                        "database, with those tables in it?")
    return out
