"""Public keys that sign EvE Conduit releases (Ed25519, base64 of the raw 32 bytes).

The release workflow signs SHA256SUMS with the private key held only in the repository's Actions secret
RELEASE_SIGNING_KEY. To rotate: add the new public key here, ship a release signed with the old key that
contains it, then sign with the new key and drop the old one in a later release.
"""

PUBLIC_KEYS = (
    "MiOOCLTiEvDSm0VsOctIUpdS4Pjcz5VswO0gPnaEuC0=",
)
