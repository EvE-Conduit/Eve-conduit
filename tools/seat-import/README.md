# SeAT import

Moves a SeAT install into EvE Conduit with **EvE-Conduit-SeAT-Import.exe**, a window you run on any Windows PC
with a dump of SeAT's database. You pick the dump, tick the users to bring over and then:

1. **Import** brings their accounts: users, characters, SSO tokens and squads.
2. **Import character data** brings everything SeAT kept for their characters: wallet history, mail,
   killmails, contracts, skills, assets and the rest. See [3. Character data](#3-character-data).

It talks to Conduit through its API, so the PC only needs to reach Conduit's address.

There is also a command-line version (`seat_import.py`) that can read SeAT's live database on the SeAT server
instead of a dump. See [Command line](#command-line).

## Before you start

1. **Same EVE application.** To keep the tokens working, give Conduit SeAT's EVE client id and secret. EVE only
   refreshes a token for the application it was issued to. If Conduit uses a different application, untick
   **Copy SSO tokens**; see [Without tokens](#without-tokens).
2. **Callback URL.** When you move over for real, point that EVE application's callback at Conduit
   (`https://<conduit>/sso/callback`). Existing tokens keep working, but SeAT logins stop. For a test import
   you can leave this until later.
3. **Stop SeAT's workers before the final dump** so SeAT doesn't refresh (and so replace) tokens after it:
   `docker compose stop worker scheduler` (check the names with `docker compose ps`).
4. **Turn on the import API** in Conduit under *Administration → API*, and create a key with the
   `import:seat` scope. Turn both off again when you're done.

## 1. Dump SeAT's database

On the SeAT server, in the seat-docker folder (often `/opt/seat-docker`), dump the tables the account import
reads. Type the database password (`DB_PASSWORD` in seat-docker's `.env`) when asked. (Bringing character data
over too? Make the full dump from [3. Character data](#3-character-data) instead; it works for both.)

```bash
docker compose exec mariadb mariadb-dump -u seat -p --single-transaction --result-file=/tmp/seat-import.sql \
  seat users refresh_tokens character_infos squads squad_member squad_moderator
docker compose cp mariadb:/tmp/seat-import.sql ./seat-import.sql
docker compose exec mariadb rm /tmp/seat-import.sql
```

A full dump of the whole database works too; the tool skips everything it doesn't need.

**The dump holds a working login for every character in it.** Copy it over SSH, keep it out of chat,
email and cloud folders, and delete every copy when the import is done.

Copy it to the Windows PC. Windows 10 and 11 have `scp` built in:

```powershell
scp you@seat-server:/opt/seat-docker/seat-import.sql $HOME\Downloads\
```

Then delete it on the server: `rm /opt/seat-docker/seat-import.sql`.

## 2. Import on Windows

Run **EvE-Conduit-SeAT-Import.exe**. Releases include it, or see [Building the program](#building-the-program).

1. **SeAT database dump:** Browse to `seat-import.sql`.
2. **EvE Conduit:** enter the address you open Conduit at (e.g. `https://auth.example.com`) and the API
   key, then **Load**. A plain `http://` address works for a test install on your own network; the window
   warns you first.
3. If you're copying tokens, tick **SeAT uses the same EVE application as Conduit** after checking the client
   id it shows against SeAT's `EVE_CLIENT_ID`.
4. **Users to import:** click users to tick them. To take many at once, type in **Search** (it matches user
   and character names), then use **Select all shown**. Users disabled in SeAT are hidden unless you tick
   *Include users disabled in SeAT*.
5. **Preview** shows how many accounts would be created and what happens to each character. It sends no
   tokens.
6. **Import** sends users 25 at a time, turns squads into groups, then has Conduit check every token it stored
   once. Tokens EVE refuses are marked for their owner to log in again.

The window saves `seat-import-report-<time>.json` next to the dump (there are no tokens in it), then offers
to delete the dump.

Importing the same users again is safe: anything already there is skipped. So you can test with a few users
first and import the rest later.

### What happens to squads

Manual and hidden squads become closed groups, with SeAT's squad moderators as group leaders. Members are
only added to a group if they're among the users you imported. Automatic squads are skipped; rebuild them as
smart groups, or tick *Import automatic squads* to copy today's members into a closed group.

## 3. Character data

Once the accounts are in, bring over everything SeAT holds for each character. EVE only serves the last month
or so of wallet, mining and similar history, and nothing at all for characters whose tokens are gone, so SeAT's
copy is the only one.

This step needs a **full** dump of SeAT's database, not just the six account tables. If you'll do both steps,
make the full dump to begin with and use it for both. On the SeAT server:

```bash
docker compose exec mariadb mariadb-dump -u seat -p --single-transaction --result-file=/tmp/seat-full.sql seat
docker compose cp mariadb:/tmp/seat-full.sql ./seat-full.sql
docker compose exec mariadb rm /tmp/seat-full.sql
```

In the window, with the accounts imported and the same users ticked, click **Import character data**. The
program reads the dump, sends Conduit only the tables it needs (compressed), and Conduit imports them in the
background while the window shows progress. A big dump means a big upload: fine on your own network, slower
over the internet.

On the command line: `seat_import.py --conduit <address> --dump seat-full.sql --history-only` (everyone in the
dump who has an account in Conduit), or add `--history` to an account import.

For a very large dump you can instead copy it to the Conduit server and import it there, with no upload:

| Install | Command |
|---|---|
| Windows | `conduit manage import_seat_history C:\path\to\seat-full.sql` (in an administrator PowerShell) |
| Linux (bare metal) | `conduit manage import_seat_history /path/to/seat-full.sql` |
| Docker | `docker compose cp seat-full.sql web:/tmp/` then `docker compose exec web python manage.py import_seat_history /tmp/seat-full.sql` (and `docker compose exec web rm /tmp/seat-full.sql` after) |

It goes through every character that is both in the dump and in Conduit:

- **History is added** to what Conduit has: wallet journal and transactions, mining, mail, killmails, contracts,
  industry jobs, market orders, notifications and calendar. Entries are matched by EVE's ids, so nothing is
  doubled and nothing Conduit already has is changed.
- **Current state** (skills, assets, blueprints, contacts, standings, loyalty points, planets, research, fittings,
  location and clones) comes from SeAT only where Conduit hasn't synced that part from EVE yet. Characters
  whose tokens are gone keep SeAT's last copy; live characters get EVE's own, newer data as usual.
- Sections filled from SeAT say so on the character sheet ("From SeAT, data as of ..."), so nobody mistakes an
  old copy for live data.

Nothing is sent to EVE while it runs, apart from looking up names SeAT didn't have, once at the end. Conduit
works from a temporary copy of the tables it needs, so allow free disk space on the Conduit server of about the
dump's size (on Docker it lives in the `seat_import` volume; elsewhere in the system temp folder, or set
`CONDUIT_SEAT_IMPORT_DIR`). Running it again is safe: it adds only what's missing.

The server command's options: `--section wallet` (repeatable) to import only some sections, `--character <id>`
to try one character first, `--report summary.json` to keep the results.

Delete the dump on every machine when you're done.

## What it never does

- Move a character that is already on a Conduit account to a different account. If someone already signed
  in to Conduit with one of their alts, their SeAT characters join that account.
- Replace a working token. It only fills in missing or broken ones.
- Touch a character that was sold (its owner hash changed).
- Change a group that grants administrator permissions, or a smart group.

## Without tokens

Untick **Copy SSO tokens** (or pass `--no-tokens` on the command line) to copy accounts, characters and squads
only. Each member logs in to Conduit once with any of their characters, and the owner check puts them back in
their imported account with their groups. Their alts are listed and ask to log in again. No credentials are
moved, and Conduit can use a different EVE application from SeAT.

## Building the program

On a Windows PC with [Python](https://www.python.org/downloads/windows/) 3.8 or newer:

```powershell
powershell -ExecutionPolicy Bypass -File tools\seat-import\build-exe.ps1
```

This writes `dist\EvE-Conduit-SeAT-Import.exe`. You can also run the window without building anything:
`py tools\seat-import\seat_import_gui.py`. On GitHub, *Actions → SeAT import → Run workflow* builds the
program and attaches it to the run.

The program isn't code-signed, so Windows SmartScreen may warn the first time you run it (*More info → Run
anyway*).

## Command line

`seat_import.py` does the same job in a terminal, with Python 3.8+ and nothing else installed.

```bash
python3 seat_import.py --conduit https://auth.example.com --dump seat-import.sql --dry-run
python3 seat_import.py --conduit https://auth.example.com --dump seat-import.sql
```

Without `--dump`, run it on the SeAT server in the seat-docker folder and it reads SeAT's live database from
the `mariadb` container. Nothing is written to disk, and it checks the client id against seat-docker's
`.env` by itself.

It asks for the Conduit API key, and for SeAT's database password when reading the live database. Neither is
shown on screen or put on a command line. You can set them as `CONDUIT_API_KEY` and `SEAT_DB_PASSWORD`
instead. Users are picked with `/text` to search, `a` to select all found and numbers to toggle; or pass
`--select users.txt` with one SeAT user id, user name or character name per line.

| Option | |
|---|---|
| `--dump FILE` | read this dump instead of the live database |
| `--history` | after the accounts, bring over the chosen users' character data too (needs a full dump) |
| `--history-only` | only bring over character data: everyone in the dump with an account in Conduit, or `--select`'s users |
| `--no-tokens` | copy accounts, characters and squads only |
| `--seat-client-id ID` | SeAT's EVE client id (otherwise it asks, or reads seat-docker's `.env`) |
| `--include-inactive` | also import users disabled in SeAT |
| `--include-auto-squads` | also import automatic squads, with today's members |
| `--dry-run` | preview only |
| `--yes` | don't ask for confirmation |
| `--report FILE` | where to write the report |
| `--allow-http` | allow a plain `http://` address that isn't this machine |
| `--seat-dir`, `--db-service`, `--db-user`, `--db-name` | live database: if yours differ from `/opt/seat-docker`, `mariadb`, `seat`, `seat` |
| `--db-command CMD` | live database without Docker: a client that reads SQL on stdin, e.g. `'mariadb -h db -u seat seat --batch --raw --skip-column-names'` (the password goes in `MYSQL_PWD`) |

SeAT's roles and permissions aren't imported; set those up in Conduit. Data from SeAT plugins (Discord, HR,
SRP, billing and so on) isn't imported either.
