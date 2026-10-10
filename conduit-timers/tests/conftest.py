# Run from the backend folder, which holds the core test settings and fixtures:
#   cd backend && python -m pytest -c pyproject.toml --rootdir . ../plugins/conduit-timers/tests
from tests.conftest import *  # noqa: F401,F403  (shared fixtures: corp, user, admin_user, api_client, ...)
# A star import skips names starting with "_": bring in core's automatic fixtures too (empty cache, no ESI calls).
from tests.conftest import _clear_cache, _no_affiliation_calls, _public_dns  # noqa: F401
