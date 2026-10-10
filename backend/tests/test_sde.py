import json
import zipfile

import pytest

from conduit.sde import importer
from conduit.sde.models import ItemType, SdeVersion, SkillInfo, SolarSystem, Station, TypeMaterial


def write_zip(path, files):
    with zipfile.ZipFile(path, "w") as zf:
        for name, rows in files.items():
            zf.writestr(f"{name}.jsonl", "\n".join(json.dumps(r) for r in rows))


def en(name):
    return {"en": name, "de": name + " (de)"}


FILES = {
    "_sde": [{"_key": "sde", "buildNumber": 100, "releaseDate": "2026-10-06T11:08:26Z"}],
    "categories": [{"_key": 6, "name": en("Ship"), "published": True}, {"_key": 16, "name": en("Skill"), "published": True}],
    "groups": [{"_key": 25, "categoryID": 6, "name": en("Frigate"), "published": True}, {"_key": 255, "categoryID": 16, "name": en("Gunnery"), "published": True}],
    "marketGroups": [{"_key": 1, "name": en("Ships"), "hasTypes": False}, {"_key": 2, "parentGroupID": 1, "name": en("Frigates"), "hasTypes": True}],
    "metaGroups": [{"_key": 1, "name": en("Tech I")}],
    "races": [{"_key": 2, "name": en("Minmatar")}],
    "bloodlines": [{"_key": 4, "raceID": 2, "name": en("Brutor")}],
    "planetSchematics": [{"_key": 65, "cycleTime": 3600, "name": en("Superconductors")}],
    "types": [
        {"_key": 587, "groupID": 25, "name": en("Rifter"), "published": True, "portionSize": 1, "volume": 27289.0, "marketGroupID": 2, "metaGroupID": 1},
        {"_key": 3300, "groupID": 255, "name": en("Gunnery"), "published": True, "portionSize": 1},
        {"_key": 484, "groupID": 74, "name": en("125mm Gatling AutoCannon I"), "published": True, "portionSize": 1},
    ],
    "typeDogma": [
        {"_key": 3300, "dogmaAttributes": [{"attributeID": 180, "value": 167.0}, {"attributeID": 181, "value": 168.0}, {"attributeID": 275, "value": 1.0}]},
        {"_key": 587, "dogmaAttributes": [{"attributeID": 182, "value": 3300.0}, {"attributeID": 277, "value": 1.0},
                                          {"attributeID": 14, "value": 4.0}, {"attributeID": 13, "value": 3.0}, {"attributeID": 12, "value": 4.0},
                                          {"attributeID": 1137, "value": 3.0}, {"attributeID": 102, "value": 3.0}, {"attributeID": 101, "value": 1.0},
                                          {"attributeID": 48, "value": 130.0}, {"attributeID": 11, "value": 41.5}, {"attributeID": 1547, "value": 1.0}]},
        {"_key": 484, "dogmaAttributes": [{"attributeID": 182, "value": 3300.0}, {"attributeID": 277, "value": 2.0}, {"attributeID": 50, "value": 4.0}],
         "dogmaEffects": [{"effectID": 12, "isDefault": False}, {"effectID": 42, "isDefault": False}]},
        {"_key": 999999, "dogmaAttributes": [{"attributeID": 182, "value": 3300.0}]},  # no such type: skipped
    ],
    "mapRegions": [{"_key": 10000002, "name": en("The Forge")}],
    "mapConstellations": [{"_key": 20000020, "regionID": 10000002, "name": en("Kimotoro")}],
    "mapSolarSystems": [{"_key": 30000142, "constellationID": 20000020, "regionID": 10000002, "name": en("Jita"), "securityStatus": 0.9459, "securityClass": "B"}],
    "npcStations": [{"_key": 60003760, "solarSystemID": 30000142, "typeID": 1531, "ownerID": 1000035}],
}


@pytest.mark.django_db
def test_import_archive(tmp_path):
    path = tmp_path / "sde.zip"
    write_zip(path, FILES)
    version = importer.update(archive=path, progress=lambda m: None)
    assert version.build_number == 100

    rifter = ItemType.objects.select_related("group__category", "market_group__parent").get(pk=587)
    assert (rifter.name, rifter.group.category.name, rifter.market_group.parent.name) == ("Rifter", "Ship", "Ships")
    skill = SkillInfo.objects.get(type_id=3300)
    assert (skill.primary_attribute, skill.secondary_attribute, skill.rank) == ("perception", "willpower", 1)
    assert not SkillInfo.objects.filter(type_id=587).exists()  # only skills get SkillInfo
    # Every type's required skills, and fitting data for ships and modules.
    assert rifter.required_skills == [[3300, 1]]
    assert rifter.fitting["hi"] == 4 and rifter.fitting["low"] == 4 and rifter.fitting["turrets"] == 3 and rifter.fitting["power"] == 41.5
    gun = ItemType.objects.get(pk=484)
    assert gun.fitting == {"slot": "hi", "turret": True, "launcher": False, "cpu": 4} and gun.required_skills == [[3300, 2]]
    assert ItemType.objects.get(pk=3300).fitting is None
    assert not ItemType.objects.filter(pk=999999).exists()
    assert SdeVersion.current().schema == importer.SCHEMA
    assert SolarSystem.objects.get(pk=30000142).display_security == 0.9

    # Re-importing updates rows in place and keeps station names fetched from ESI.
    Station.objects.filter(pk=60003760).update(name="Jita IV - Moon 4")
    FILES["types"][0]["name"] = en("Rifter II")
    FILES["_sde"][0]["buildNumber"] = 101
    write_zip(path, FILES)
    importer.update(archive=path, progress=lambda m: None)
    assert ItemType.objects.get(pk=587).name == "Rifter II"
    assert Station.objects.get(pk=60003760).name == "Jita IV - Moon 4"
    assert SdeVersion.current().build_number == 101


@pytest.mark.django_db
def test_reprocessing_materials_and_compression(tmp_path):
    files = {
        **FILES,
        "types": [
            {"_key": 1230, "groupID": 462, "name": en("Veldspar"), "published": True, "portionSize": 100, "volume": 0.1},
            {"_key": 62516, "groupID": 462, "name": en("Compressed Veldspar"), "published": True, "portionSize": 100, "volume": 0.001},
        ],
        "compressibleTypes": [{"_key": 1230, "compressedTypeID": 62516}],
        "typeMaterials": [
            {"_key": 1230, "materials": [{"materialTypeID": 34, "quantity": 400}]},
            {"_key": 62516, "materials": [{"materialTypeID": 34, "quantity": 400}]},
            # Random yields have no fixed output: skipped.
            {"_key": 90041, "randomizedMaterials": [{"materialTypeID": 34, "quantityMax": 10, "quantityMin": 5}]},
        ],
    }
    write_zip(tmp_path / "sde.zip", files)
    importer.update(archive=tmp_path / "sde.zip", progress=lambda m: None)
    assert ItemType.objects.get(pk=1230).compressed_type_id == 62516
    assert ItemType.objects.get(pk=62516).compressed_type_id is None
    assert list(TypeMaterial.objects.filter(type_id=1230).values_list("material_type_id", "quantity")) == [(34, 400)]
    assert TypeMaterial.objects.count() == 2

    # Materials CCP drops are dropped here too.
    files["typeMaterials"] = files["typeMaterials"][:1]
    files["_sde"] = [{"_key": "sde", "buildNumber": 102}]
    write_zip(tmp_path / "sde.zip", files)
    importer.update(archive=tmp_path / "sde.zip", progress=lambda m: None)
    assert list(TypeMaterial.objects.values_list("type_id", flat=True)) == [1230]


@pytest.mark.django_db
def test_update_skips_when_current(monkeypatch):
    SdeVersion.objects.create(build_number=100, schema=importer.SCHEMA)
    monkeypatch.setattr(importer, "latest_build", lambda: {"buildNumber": 100})
    monkeypatch.setattr(importer, "download", lambda *a: pytest.fail("should not download"))
    assert importer.update(progress=lambda m: None) is None


@pytest.mark.django_db
def test_update_reimports_when_the_importer_reads_more(monkeypatch, tmp_path):
    """An install whose build was imported by an older EvE Conduit imports it again to get the new data."""
    SdeVersion.objects.create(build_number=100, schema=1)
    write_zip(tmp_path / "sde.zip", FILES)
    monkeypatch.setattr(importer, "latest_build", lambda: {"buildNumber": 100})
    monkeypatch.setattr(importer, "download", lambda build, dest: tmp_path / "sde.zip")
    assert importer.update(progress=lambda m: None).schema == importer.SCHEMA
    assert importer.update(progress=lambda m: None) is None


@pytest.mark.django_db
def test_missing_file_is_skipped(tmp_path):
    files = {k: v for k, v in FILES.items() if k != "planetSchematics"}
    write_zip(tmp_path / "sde.zip", files)
    assert importer.update(archive=tmp_path / "sde.zip", progress=lambda m: None) is not None


@pytest.mark.django_db
@pytest.mark.parametrize("schema,queued", [(1, True), (importer.SCHEMA, False)])
def test_init_reimports_static_data_from_an_older_version(monkeypatch, schema, queued):
    from django.core.management import call_command

    from conduit.sde import tasks

    calls = []
    monkeypatch.setattr(tasks.update_sde, "delay", lambda *a, **k: calls.append(1))
    SdeVersion.objects.create(build_number=100, schema=schema)
    call_command("conduit_init", stdout=open("/dev/null", "w"))
    assert bool(calls) is queued


@pytest.mark.django_db
def test_new_workers_reimport_static_data_left_by_an_older_version(monkeypatch):
    """The import conduit_init queues can be taken by a worker still running the old version; new workers check."""
    from conduit.sde import tasks

    runs = []
    monkeypatch.setattr(importer, "update", lambda force=False: runs.append(force))
    tasks.update_sde_if_outdated()
    assert runs == []  # nothing imported yet: the first import is conduit_init's job
    SdeVersion.objects.create(build_number=100, schema=1)
    tasks.update_sde_if_outdated()
    assert runs == [False]
    # Only one import at a time.
    from django.core.cache import cache

    cache.set(tasks.IMPORTING_KEY, True)
    assert tasks.update_sde() is None and runs == [False]


@pytest.mark.django_db
def test_health_shows_outdated_static_data_and_imports_again(monkeypatch, api_client, admin_user, user):
    from conduit.sde import tasks

    queued = []
    monkeypatch.setattr(tasks.update_sde, "delay", lambda **kw: queued.append(kw))
    SdeVersion.objects.create(build_number=100, schema=1)
    api_client.force_login(admin_user)
    data = api_client.call("get", "/api/admin/health").json()["data"]
    assert data["sde_outdated"] and not data["ok"] and not data["sde_importing"]
    assert api_client.call("post", "/api/admin/health/static-data").json() == {"queued": True}
    assert queued == [{"force": True}]
    api_client.force_login(user)
    assert api_client.call("post", "/api/admin/health/static-data").status_code == 403
