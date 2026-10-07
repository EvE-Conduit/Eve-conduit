"""Sign a release's SHA256SUMS (used by the release workflow).

    RELEASE_SIGNING_KEY=<base64 raw Ed25519 private key> python scripts/sign-release.py dist/SHA256SUMS

Writes dist/SHA256SUMS.sig (base64 of the signature) and checks it against the public keys the release itself
ships in backend/conduit/updates/keys.py, so a release signed with the wrong key never goes out. Needs only the
cryptography package (it doesn't import EvE Conduit itself).
"""

import base64
import os
import runpy
import sys
from pathlib import Path

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey

keys_file = Path(__file__).resolve().parent.parent / "backend" / "conduit" / "updates" / "keys.py"
trusted = runpy.run_path(str(keys_file))["PUBLIC_KEYS"]

sums_path = Path(sys.argv[1])
secret = os.environ.get("RELEASE_SIGNING_KEY", "").strip()
if not secret:
    sys.exit("RELEASE_SIGNING_KEY is not set")
key = Ed25519PrivateKey.from_private_bytes(base64.b64decode(secret))
sums = sums_path.read_bytes()
raw = key.sign(sums)


def trusted_by(public: str) -> bool:
    try:
        Ed25519PublicKey.from_public_bytes(base64.b64decode(public)).verify(raw, sums)
        return True
    except InvalidSignature:
        return False


if not any(trusted_by(k) for k in trusted):
    sys.exit("RELEASE_SIGNING_KEY doesn't match any public key in backend/conduit/updates/keys.py")
sums_path.with_name(sums_path.name + ".sig").write_bytes(base64.b64encode(raw) + b"\n")
print(f"signed {sums_path}")
