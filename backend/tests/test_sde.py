import json
import zipfile

import pytest

from conduit.sde import importer
from conduit.sde.models import ItemType, SdeVersion, SkillInfo, SolarSystem, Station


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
    ],
    "typeDogma": [
        {"_key": 3300, "dogmaAttributes": [{"attributeID": 180, "value": 167.0}, {"attributeID": 181, "value": 168.0}, {"attributeID": 275, "value": 1.0}]},
        {"_key": 587, "dogmaAttributes": [{"attributeID": 182, "value": 3300.0}, {"attributeID": 277, "value": 1.0}]},
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
def test_update_skips_when_current(monkeypatch):
    SdeVersion.objects.create(build_number=100)
    monkeypatch.setattr(importer, "latest_build", lambda: {"buildNumber": 100})
    monkeypatch.setattr(importer, "download", lambda *a: pytest.fail("should not download"))
    assert importer.update(progress=lambda m: None) is None


@pytest.mark.django_db
def test_missing_file_is_skipped(tmp_path):
    files = {k: v for k, v in FILES.items() if k != "planetSchematics"}
    write_zip(tmp_path / "sde.zip", files)
    assert importer.update(archive=tmp_path / "sde.zip", progress=lambda m: None) is not None
