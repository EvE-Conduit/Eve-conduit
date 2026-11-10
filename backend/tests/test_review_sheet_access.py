"""Regression tests for the review of who sees what on the character and corporation sheets, the refresh buttons,
affiliation updates and the SeAT history import's working files."""

import os
import stat

import pytest
from django.contrib.auth.models import Permission

from conduit.esi.client import EsiResponse
from conduit.esi.exceptions import EsiError
from conduit.eve.models import EveCorporation

from .conftest import make_user
from .seat_history import token_row, write_dump


def grant(user, *codenames):
    user.user_permissions.add(*Permission.objects.filter(codename__in=codenames))
    return type(user).objects.get(pk=user.pk)


def test_sharing_an_npc_corporation_gives_no_reach(db, corp):
    from conduit.sheet.access import can_view, viewable_characters

    npc = EveCorporation.objects.create(id=1000169, name="Center for Advanced Studies", ticker="CAS")
    viewer = grant(make_user(90000301, "Viewer", corporation=npc), "view_corporation_characters")
    stranger = make_user(90000302, "Stranger Alt", corporation=npc).main_character
    assert not can_view(viewer, stranger)
    assert set(viewable_characters(viewer).values_list("pk", flat=True)) == {90000301}

    # A player corporation still works.
    officer = grant(make_user(90000303, "Officer", corporation=corp), "view_corporation_characters")
    mate = make_user(90000304, "Corp Mate", corporation=corp).main_character
    assert can_view(officer, mate)
    assert set(viewable_characters(officer).values_list("pk", flat=True)) == {90000303, 90000304}


def test_members_tab_names_owners_only_within_the_viewers_reach(db, corp, api_client):
    from conduit.corp.models import CorporationMember

    viewer = grant(make_user(90000311, "Viewer", corporation=corp), "view_own_corporation")
    make_user(90000312, "Someone Else", corporation=corp)
    for cid in (90000311, 90000312, 2112000000):
        CorporationMember.objects.create(corporation=corp, character_id=cid)

    def owners():
        rows = api_client.get(f"/api/corporations/{corp.pk}/members").json()["items"]
        return {m["id"]: (m["registered"], m["owner"] and m["owner"]["id"]) for m in rows}

    api_client.force_login(viewer)
    other = type(viewer).objects.get(main_character_id=90000312).pk
    # Their own character is theirs to see; the other member is registered, but whose it is stays unsaid.
    assert owners() == {90000311: (True, viewer.pk), 90000312: (True, None), 2112000000: (False, None)}
    viewer = grant(viewer, "view_corporation_characters")
    api_client.force_login(viewer)
    assert owners()[90000312] == (True, other)


def test_refresh_is_queued_once_per_minute(db, corp, client, monkeypatch):
    queued = []
    monkeypatch.setattr("conduit.sheet.tasks.sync_section.apply_async", lambda args, queue: queued.append(args))
    monkeypatch.setattr("conduit.corp.tasks.sync_section.apply_async", lambda args, queue: queued.append(args))
    user = grant(make_user(90000321, "Pilot", corporation=corp), "refresh_characters", "refresh_corporations", "view_own_corporation")
    client.force_login(user)
    assert client.post("/api/characters/90000321/refresh").status_code == 200
    once = len(queued)
    assert once and client.post("/api/characters/90000321/refresh").status_code == 200 and len(queued) == once
    assert client.post(f"/api/corporations/{corp.pk}/refresh").status_code == 200
    both = len(queued)
    assert both > once and client.post(f"/api/corporations/{corp.pk}/refresh").status_code == 200 and len(queued) == both


def test_one_unreadable_corporation_does_not_stop_the_affiliation_run(db, corp, monkeypatch):
    from conduit.eve import tasks

    mover = make_user(90000331, "Mover", corporation=corp).main_character
    stuck = make_user(90000332, "Stuck", corporation=corp).main_character
    target = {90000331: 98000002, 90000332: 98000003}

    class Fake:
        def post(self, path, body):
            return EsiResponse([{"character_id": i, "corporation_id": target[i]} for i in body], 200, {})

        def get(self, path):
            if path == "/corporations/98000003":
                raise EsiError(502, "bad gateway")
            return EsiResponse({"name": "New Corp", "ticker": "NCRP", "member_count": 12}, 200, {})

    monkeypatch.setattr(tasks, "esi", lambda: Fake())
    assert tasks.update_affiliations.run() == 1
    mover.refresh_from_db()
    stuck.refresh_from_db()
    assert mover.corporation_id == 98000002 and stuck.corporation_id == corp.pk


# --- SeAT history import ---------------------------------------------------------------


def _dump(tmp_path):
    return write_dump(tmp_path / "seat.sql", {
        "refresh_tokens": [token_row(90000001)],
        "universe_names": [{"entity_id": 3000000 + i, "name": f"Name {i}", "category": "character"} for i in range(4500)]
        + [{"entity_id": 3999999, "name": None, "category": None}],
        "corporation_wallet_journals": [{"corporation_id": 98000001, "division": d, "id": d, "date": "2024-01-01 00:00:00"} for d in (1, 1, 3)],
    })


def test_staging_is_replaced_not_doubled_when_loaded_again(tmp_path):
    from conduit.sheet.seat.staging import Staging

    path = str(tmp_path / "work.sqlite3")
    for _ in range(2):
        store = Staging(path)
        store.load(str(_dump(tmp_path)), ["refresh_tokens", "corporation_wallet_journals"], {})
        counts = len(store.rows("refresh_tokens")), len(list(store.iter_rows("corporation_wallet_journals", corporation_id=98000001)))
        divisions = store.distinct("corporation_wallet_journals", "division", corporation_id=98000001)
        store.close()
    assert counts == (1, 3) and divisions == {1, 3}


def test_names_from_seat_come_over_in_batches(db, tmp_path):
    from conduit.eve.models import EveName
    from conduit.sheet.seat import history
    from conduit.sheet.seat.staging import Staging

    store = Staging(str(tmp_path / "work.sqlite3"))
    store.load(str(_dump(tmp_path)), ["universe_names"], {})
    assert history.preload_names(store) == 4501
    store.close()
    assert EveName.objects.count() == 4501 and EveName.objects.get(pk=3999999).name == ""


@pytest.mark.skipif(os.name != "posix", reason="file modes")
def test_kept_working_copy_is_private(db, tmp_path):
    from conduit.sheet.seat import history

    path = tmp_path / "work.sqlite3"
    old = os.umask(0o022)
    try:
        history.run(str(_dump(tmp_path)), sections=["wallet"], staging_path=str(path), lookup_names=False, say=lambda *a: None)
    finally:
        os.umask(old)
    assert stat.S_IMODE(path.stat().st_mode) == 0o600


@pytest.mark.skipif(not hasattr(os, "geteuid"), reason="needs file owners")
def test_upload_folder_of_another_user_is_refused(tmp_path, settings, monkeypatch):
    from ninja.errors import HttpError

    from conduit.sheet.seat import runs

    settings.CONDUIT_SEAT_IMPORT_DIR = ""
    monkeypatch.setattr(runs.tempfile, "gettempdir", lambda: str(tmp_path))
    assert runs.run_dir() == tmp_path / "conduit-seat-history"  # our own folder is fine
    me = os.geteuid()
    monkeypatch.setattr(runs.os, "geteuid", lambda: me + 1)  # as if someone else had made it first
    with pytest.raises(runs.RunError):
        runs.run_dir()
    with pytest.raises(HttpError):
        runs.create()
    # A folder the operator configured is theirs to own as they like (a Docker volume, say).
    settings.CONDUIT_SEAT_IMPORT_DIR = str(tmp_path / "configured")
    assert runs.run_dir().is_dir()
