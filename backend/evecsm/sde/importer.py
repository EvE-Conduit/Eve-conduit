"""Download and import CCP's Static Data Export (JSON Lines edition).

https://developers.eveonline.com/docs/services/static-data/
"""

from __future__ import annotations

import json
import logging
import tempfile
import time
import zipfile
from collections.abc import Callable, Iterator
from datetime import datetime
from pathlib import Path

import httpx
from django.db import transaction

from evecsm.esi.client import user_agent
from evecsm.db import upsert

from .models import (
    Bloodline,
    Constellation,
    ItemCategory,
    ItemGroup,
    ItemType,
    MarketGroup,
    MetaGroup,
    PlanetSchematic,
    Race,
    Region,
    SdeVersion,
    SkillInfo,
    SolarSystem,
    Station,
)

log = logging.getLogger(__name__)

BASE_URL = "https://developers.eveonline.com/static-data/tranquility"
LATEST_URL = f"{BASE_URL}/latest.jsonl"
SKILL_CATEGORY = 16
BATCH = 2000

# dogma attribute ids
PRIMARY_ATTRIBUTE, SECONDARY_ATTRIBUTE, SKILL_RANK = 180, 181, 275
REQUIRED_SKILLS = [(182, 277), (183, 278), (184, 279), (1285, 1286), (1289, 1287), (1290, 1288)]


def latest_build() -> dict:
    """``{"buildNumber": ..., "releaseDate": ...}`` of the newest SDE."""
    resp = httpx.get(LATEST_URL, headers={"User-Agent": user_agent()}, timeout=30, follow_redirects=True)
    resp.raise_for_status()
    for line in resp.text.splitlines():
        row = json.loads(line)
        if row.get("_key") == "sde":
            return row
    raise ValueError("latest.jsonl has no 'sde' record")


def download(build_number: int, dest: Path) -> Path:
    url = f"{BASE_URL}/eve-online-static-data-{build_number}-jsonl.zip"
    log.info("Downloading %s", url)
    with httpx.stream("GET", url, headers={"User-Agent": user_agent()}, timeout=120, follow_redirects=True) as resp:
        resp.raise_for_status()
        with dest.open("wb") as fh:
            for chunk in resp.iter_bytes(1 << 20):
                fh.write(chunk)
    return dest


def _records(zf: zipfile.ZipFile, name: str) -> Iterator[dict]:
    if f"{name}.jsonl" not in zf.namelist():
        # CCP occasionally renames or drops files; skip rather than fail the whole import.
        log.warning("SDE archive has no %s.jsonl; skipping it", name)
        return
    with zf.open(f"{name}.jsonl") as fh:
        for line in fh:
            if line.strip():
                yield json.loads(line)


def _en(value) -> str:
    if isinstance(value, dict):
        return value.get("en") or next(iter(value.values()), "")
    return value or ""


def _upsert(model, objects: Iterator, update_fields: list[str], unique_field: str = "id") -> int:
    count, batch = 0, []
    for obj in objects:
        batch.append(obj)
        if len(batch) >= BATCH:
            count += _flush(model, batch, update_fields, unique_field)
            batch = []
    if batch:
        count += _flush(model, batch, update_fields, unique_field)
    return count


def _flush(model, batch, update_fields, unique_field) -> int:
    upsert(model, batch, unique_fields=[unique_field], update_fields=update_fields)
    return len(batch)


# --- one function per SDE file -------------------------------------------------


def _categories(zf):
    rows = (ItemCategory(id=r["_key"], name=_en(r.get("name")), published=r.get("published", False)) for r in _records(zf, "categories"))
    return _upsert(ItemCategory, rows, ["name", "published"])


def _groups(zf):
    rows = (
        ItemGroup(id=r["_key"], category_id=r["categoryID"], name=_en(r.get("name")), published=r.get("published", False))
        for r in _records(zf, "groups")
    )
    return _upsert(ItemGroup, rows, ["category", "name", "published"])


def _market_groups(zf):
    rows = (
        MarketGroup(
            id=r["_key"],
            parent_id=r.get("parentGroupID"),
            name=_en(r.get("name")),
            has_types=r.get("hasTypes", False),
            icon_id=r.get("iconID"),
        )
        for r in _records(zf, "marketGroups")
    )
    return _upsert(MarketGroup, rows, ["parent", "name", "has_types", "icon_id"])


def _meta_groups(zf):
    rows = (MetaGroup(id=r["_key"], name=_en(r.get("name"))) for r in _records(zf, "metaGroups"))
    return _upsert(MetaGroup, rows, ["name"])


TYPE_FIELDS = {
    "volume": "volume",
    "packaged_volume": "packagedVolume",
    "capacity": "capacity",
    "mass": "mass",
    "base_price": "basePrice",
    "icon_id": "iconID",
    "race_id": "raceID",
    "tech_level": "techLevel",
    "market_group_id": "marketGroupID",
    "meta_group_id": "metaGroupID",
}


def _types(zf, skill_ids: set[int], skill_groups: set[int]):
    def rows():
        for r in _records(zf, "types"):
            if r["groupID"] in skill_groups:
                skill_ids.add(r["_key"])
            yield ItemType(
                id=r["_key"],
                group_id=r["groupID"],
                name=_en(r.get("name")),
                description=_en(r.get("description")),
                published=r.get("published", False),
                portion_size=r.get("portionSize", 1),
                **{field: r.get(key) for field, key in TYPE_FIELDS.items()},
            )

    fields = [
        "group",
        "name",
        "description",
        "published",
        "portion_size",
        *(f.removesuffix("_id") if f.endswith("_group_id") else f for f in TYPE_FIELDS),
    ]
    return _upsert(ItemType, rows(), fields)


def _skills(zf, skill_ids: set[int]):
    def rows():
        for r in _records(zf, "typeDogma"):
            if r["_key"] not in skill_ids:
                continue
            attrs = {a["attributeID"]: a["value"] for a in r.get("dogmaAttributes", [])}
            required = [[int(attrs[skill]), int(attrs.get(level, 1))] for skill, level in REQUIRED_SKILLS if attrs.get(skill)]
            yield SkillInfo(
                type_id=r["_key"],
                rank=attrs.get(SKILL_RANK, 1),
                primary_attribute=SkillInfo.ATTRIBUTES.get(int(attrs.get(PRIMARY_ATTRIBUTE, 0)), ""),
                secondary_attribute=SkillInfo.ATTRIBUTES.get(int(attrs.get(SECONDARY_ATTRIBUTE, 0)), ""),
                required_skills=required,
            )

    return _upsert(SkillInfo, rows(), ["rank", "primary_attribute", "secondary_attribute", "required_skills"], unique_field="type")


def _races(zf):
    return _upsert(Race, (Race(id=r["_key"], name=_en(r.get("name"))) for r in _records(zf, "races")), ["name"])


def _bloodlines(zf):
    rows = (Bloodline(id=r["_key"], race_id=r.get("raceID"), name=_en(r.get("name"))) for r in _records(zf, "bloodlines"))
    return _upsert(Bloodline, rows, ["race_id", "name"])


def _schematics(zf):
    rows = (PlanetSchematic(id=r["_key"], name=_en(r.get("name")), cycle_time=r.get("cycleTime")) for r in _records(zf, "planetSchematics"))
    return _upsert(PlanetSchematic, rows, ["name", "cycle_time"])


def _regions(zf):
    return _upsert(Region, (Region(id=r["_key"], name=_en(r.get("name"))) for r in _records(zf, "mapRegions")), ["name"])


def _constellations(zf):
    rows = (Constellation(id=r["_key"], region_id=r["regionID"], name=_en(r.get("name"))) for r in _records(zf, "mapConstellations"))
    return _upsert(Constellation, rows, ["region", "name"])


def _systems(zf):
    rows = (
        SolarSystem(
            id=r["_key"],
            constellation_id=r["constellationID"],
            region_id=r["regionID"],
            name=_en(r.get("name")),
            security_status=r.get("securityStatus", 0),
            security_class=r.get("securityClass", ""),
        )
        for r in _records(zf, "mapSolarSystems")
    )
    return _upsert(SolarSystem, rows, ["constellation", "region", "name", "security_status", "security_class"])


def _stations(zf):
    rows = (
        Station(id=r["_key"], solar_system_id=r["solarSystemID"], type_id=r["typeID"], owner_id=r.get("ownerID"))
        for r in _records(zf, "npcStations")
    )
    # Names come from ESI later; never overwrite them here.
    return _upsert(Station, rows, ["solar_system", "type_id", "owner_id"])


def import_archive(path: Path, build: dict, progress: Callable[[str], None] = log.info) -> SdeVersion:
    started = time.monotonic()
    with zipfile.ZipFile(path) as zf, transaction.atomic():
        for label, step in [
            ("categories", _categories),
            ("groups", _groups),
            ("market groups", _market_groups),
            ("meta groups", _meta_groups),
            ("races", _races),
            ("bloodlines", _bloodlines),
            ("planet schematics", _schematics),
        ]:
            progress(f"{label}: {step(zf)}")

        skill_groups = set(ItemGroup.objects.filter(category_id=SKILL_CATEGORY).values_list("id", flat=True))
        skill_ids: set[int] = set()
        progress(f"types: {_types(zf, skill_ids, skill_groups)}")
        progress(f"skills: {_skills(zf, skill_ids)}")

        for label, step in [
            ("regions", _regions),
            ("constellations", _constellations),
            ("solar systems", _systems),
            ("stations", _stations),
        ]:
            progress(f"{label}: {step(zf)}")

        release = build.get("releaseDate")
        version, _ = SdeVersion.objects.update_or_create(
            build_number=build["buildNumber"],
            defaults={"release_date": datetime.fromisoformat(release.replace("Z", "+00:00")) if release else None},
        )
    progress(f"SDE build {version.build_number} imported in {time.monotonic() - started:.0f}s")
    return version


def update(force: bool = False, archive: Path | None = None, progress: Callable[[str], None] = log.info) -> SdeVersion | None:
    """Import the newest SDE if it is newer than what we have. Returns the new version, or None."""
    if archive:
        with zipfile.ZipFile(archive) as zf:
            build = next(_records(zf, "_sde"))
        return import_archive(archive, build, progress)

    build = latest_build()
    current = SdeVersion.current()
    if current and current.build_number >= build["buildNumber"] and not force:
        progress(f"SDE is up to date (build {current.build_number})")
        return None
    with tempfile.TemporaryDirectory(prefix="evecsm-sde-") as tmp:
        path = download(build["buildNumber"], Path(tmp) / "sde.zip")
        return import_archive(path, build, progress)
