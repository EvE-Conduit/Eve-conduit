import os
import tempfile

# Override (not default) so a developer's own environment can't leak into tests.
os.environ.update(
    {
        "CONDUIT_SECRET_KEY": "test-secret",
        "CONDUIT_EXTRA_PLUGINS": "tests.sample_plugin.plugin:SamplePlugin",
        "ESI_CLIENT_ID": "test-client",
        "ESI_SECRET_KEY": "test-secret-key",
        "CONDUIT_SITE_URL": "http://localhost:5173",
        # Set CONDUIT_TEST_DATABASE_URL to run the suite on PostgreSQL or MariaDB.
        "DATABASE_URL": os.environ.get("CONDUIT_TEST_DATABASE_URL", "sqlite:///:memory:"),
    }
)
os.environ.pop("REDIS_URL", None)

from conduit.settings import *  # noqa: E402,F403

# Demo mode's database: a file of its own per run, built once by tests/test_demo.py (only tests that ask for the
# "demo" database get it).
DATABASES["demo"]["NAME"] = DATABASES["demo"]["TEST"]["NAME"] = os.path.join(
    tempfile.mkdtemp(prefix="conduit-demo-test-"), "demo.sqlite3"
)

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
