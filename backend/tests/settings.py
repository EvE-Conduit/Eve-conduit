import os

# Override (not default) so a developer's own environment can't leak into tests.
os.environ.update(
    {
        "EVECSM_SECRET_KEY": "test-secret",
        "EVECSM_EXTRA_MODULES": "tests.sample_module.module:SampleModule",
        "ESI_CLIENT_ID": "test-client",
        "ESI_SECRET_KEY": "test-secret-key",
        "EVECSM_SITE_URL": "http://localhost:5173",
        # Set EVECSM_TEST_DATABASE_URL to run the suite on PostgreSQL or MariaDB.
        "DATABASE_URL": os.environ.get("EVECSM_TEST_DATABASE_URL", "sqlite:///:memory:"),
    }
)
os.environ.pop("REDIS_URL", None)

from evecsm.settings import *  # noqa: E402,F403

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
