"""Sign a release's SHA256SUMS (used by the release workflow).

    RELEASE_SIGNING_KEY=<base64 raw Ed25519 private key> python scripts/sign-release.py dist/SHA256SUMS

Writes dist/SHA256SUMS.sig (base64 of the signature) and checks it against the public keys the release itself
ships in backend/conduit/updates/keys.py, so a release signed with the wrong key never goes out.
"""

import base64
import os
import sys
from pathlib import Path

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))
from conduit.updates.verify import check_signature  # noqa: E402

sums_path = Path(sys.argv[1])
secret = os.environ.get("RELEASE_SIGNING_KEY", "").strip()
if not secret:
    sys.exit("RELEASE_SIGNING_KEY is not set")
key = Ed25519PrivateKey.from_private_bytes(base64.b64decode(secret))
sums = sums_path.read_bytes()
signature = base64.b64encode(key.sign(sums))
check_signature(sums, signature)  # raises if the key isn't one the release trusts
sums_path.with_name(sums_path.name + ".sig").write_bytes(signature + b"\n")
print(f"signed {sums_path}")
