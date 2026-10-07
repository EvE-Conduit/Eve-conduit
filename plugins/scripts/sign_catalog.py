"""Sign catalog.json with the EvE Conduit release key (used by the catalog workflow).

    RELEASE_SIGNING_KEY=<base64 raw Ed25519 private key> python scripts/sign_catalog.py catalog.json

Writes catalog.json.sig (base64 of the signature). Installs only accept a catalog signed by a key listed in
EvE Conduit's backend/conduit/updates/keys.py. Needs the cryptography package.
"""

import base64
import os
import sys
from pathlib import Path

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

path = Path(sys.argv[1])
secret = os.environ.get("RELEASE_SIGNING_KEY", "").strip()
if not secret:
    sys.exit("RELEASE_SIGNING_KEY is not set")
key = Ed25519PrivateKey.from_private_bytes(base64.b64decode(secret))
path.with_name(path.name + ".sig").write_bytes(base64.b64encode(key.sign(path.read_bytes())) + b"\n")
print(f"signed {path}")
