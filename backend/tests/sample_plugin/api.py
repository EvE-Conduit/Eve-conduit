from ninja import Router

router = Router()


@router.get("/hello")
def hello(request):
    return {"hello": request.user.display_name}


# For everyone, signed in or not; see SamplePlugin.public_api.
public_router = Router()


@public_router.get("/ping")
def public_ping(request):
    return {"signed_in": request.user.is_authenticated}


# For external services (API keys); see SamplePlugin.external_api.
from conduit.external.auth import require_scope  # noqa: E402

external_router = Router()


@external_router.get("/ping")
@require_scope("p.sample:read")
def ping(request):
    return {"pong": request.api_key.name}


def search(request, q, limit):
    return {"key": "sample", "label": "Sample widgets",
            "hits": [{"id": "sample:1", "title": f"Widget {q}", "icon": "flask-conical", "url": "/p/sample"}]}


def sheet_access(user, character):
    """Lets anyone read a character called "Open Book" (tests the plugin hook)."""
    return character.name == "Open Book"
