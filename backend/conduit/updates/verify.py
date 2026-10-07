"""Checking a downloaded release before anything installs it.

Deliberately free of Django so the privileged updater (Windows scheduled task / root cron job) can run it
with the install's own Python::

    python -I -m conduit.updates.verify <release file> <SHA256SUMS> <SHA256SUMS.sig>

Exit code 0 means: SHA256SUMS carries a valid signature from one of ``keys.PUBLIC_KEYS`` and lists the
release file with the hash it actually has. Anything else exits non-zero with the reason on stderr.
"""

from __future__ import annotations

import base64
import hashlib
import sys
from pathlib import Path

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

from .keys import PUBLIC_KEYS


class VerificationError(Exception):
    pass


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def check_signature(sums: bytes, signature: bytes, keys=PUBLIC_KEYS) -> None:
    """``signature`` is the .sig file's content: base64 of the 64-byte Ed25519 signature."""
    try:
        raw = base64.b64decode(signature.strip(), validate=True)
    except ValueError:
        raise VerificationError("the signature file is not valid base64") from None
    for key in keys:
        try:
            Ed25519PublicKey.from_public_bytes(base64.b64decode(key)).verify(raw, sums)
            return
        except InvalidSignature:
            continue
    raise VerificationError("the checksum list is not signed by an EvE Conduit release key")


def listed_hash(sums: bytes, filename: str) -> str:
    """The hash SHA256SUMS gives for ``filename`` (``sha256sum`` format: "<hex>  <name>")."""
    for line in sums.decode("utf-8", "replace").splitlines():
        parts = line.strip().split()
        if len(parts) == 2 and parts[1].lstrip("*") == filename:
            return parts[0].lower()
    raise VerificationError(f"{filename} is not in the signed checksum list")


def verify_release(path: Path, sums: bytes, signature: bytes, keys=PUBLIC_KEYS) -> str:
    """Raise VerificationError unless ``path`` is a signed release file; returns its hash."""
    check_signature(sums, signature, keys)
    expected = listed_hash(sums, path.name)
    actual = sha256_file(path)
    if actual != expected:
        raise VerificationError(f"{path.name} does not match its signed checksum")
    return actual


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("usage: python -I -m conduit.updates.verify <release file> <SHA256SUMS> <SHA256SUMS.sig>", file=sys.stderr)
        return 2
    release, sums, sig = (Path(a) for a in argv)
    try:
        verify_release(release, sums.read_bytes(), sig.read_bytes())
    except (OSError, VerificationError) as exc:
        print(f"verification failed: {exc}", file=sys.stderr)
        return 1
    print(f"{release.name}: signature and checksum OK")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
