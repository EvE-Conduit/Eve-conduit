# Run from the backend folder, which holds the core test settings and fixtures:
#   cd backend && python -m pytest ../plugins/conduit-mentors/tests
from tests.conftest import *  # noqa: F401,F403  (shared fixtures: corp, user, admin_user, api_client, ...)
