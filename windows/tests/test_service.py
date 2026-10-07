"""Tests for the Windows launcher's pure-Python parts (runs on any OS).

    python -m pytest windows/tests
"""

import importlib.util
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("evecsm_service", HERE.parent / "service" / "evecsm_service.py")
service = importlib.util.module_from_spec(spec)
spec.loader.exec_module(service)


def test_read_env_file(tmp_path):
    f = tmp_path / "evecsm.env"
    f.write_text('﻿# comment\nA=1\n\nB = "two words"\nC=\'x=y\'\nBROKEN LINE\nD=\n', encoding="utf-8")
    assert service.read_env_file(f) == {"A": "1", "B": "two words", "C": "x=y", "D": ""}


def test_install_root_from_layout(monkeypatch):
    monkeypatch.delenv("EVECSM_ROOT", raising=False)
    # <root>/app/windows/service/evecsm_service.py
    assert service.install_root() == Path(service.__file__).absolute().parents[3]


def test_install_root_does_not_follow_the_app_junction(monkeypatch, tmp_path):
    monkeypatch.delenv("EVECSM_ROOT", raising=False)
    release = tmp_path / "releases" / "1.0.0" / "windows" / "service"
    release.mkdir(parents=True)
    target = release / "evecsm_service.py"
    target.write_text("")
    (tmp_path / "app").symlink_to(tmp_path / "releases" / "1.0.0")
    monkeypatch.setattr(service, "__file__", str(tmp_path / "app" / "windows" / "service" / "evecsm_service.py"))
    assert service.install_root() == tmp_path


def test_install_root_from_env(monkeypatch, tmp_path):
    monkeypatch.setenv("EVECSM_ROOT", str(tmp_path))
    assert service.install_root() == tmp_path


def test_load_settings_keeps_real_environment(monkeypatch, tmp_path):
    (tmp_path / "config").mkdir()
    (tmp_path / "config" / "evecsm.env").write_text("FROM_FILE=file\nOVERRIDE=file\n")
    monkeypatch.setenv("OVERRIDE", "env")
    monkeypatch.delenv("FROM_FILE", raising=False)
    monkeypatch.delenv("EVECSM_STATIC_ROOT", raising=False)
    service.load_settings(tmp_path)
    import os

    assert os.environ["FROM_FILE"] == "file" and os.environ["OVERRIDE"] == "env"
    assert os.environ["EVECSM_STATIC_ROOT"] == str(tmp_path / "data" / "static")
