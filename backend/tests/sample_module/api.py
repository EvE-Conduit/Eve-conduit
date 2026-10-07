from ninja import Router

router = Router()


@router.get("/hello")
def hello(request):
    return {"hello": request.user.display_name}


# For external services (API keys); see SampleModule.external_api.
from evecsm.external.auth import require_scope  # noqa: E402

external_router = Router()


@external_router.get("/ping")
@require_scope("m.sample:read")
def ping(request):
    return {"pong": request.api_key.name}


def search(request, q, limit):
    return {"key": "sample", "label": "Sample widgets",
            "hits": [{"id": "sample:1", "title": f"Widget {q}", "icon": "flask-conical", "url": "/m/sample"}]}
