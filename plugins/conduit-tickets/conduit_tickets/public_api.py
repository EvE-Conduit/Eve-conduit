"""Mounted at /api/public/p/tickets/. Discord posts clicks on panels here, so it can't sign in: every request must carry
Discord's signature, and nothing else about it is looked at until that checks out."""

import json

from django.http import HttpResponse, JsonResponse
from ninja import Router

from . import panels

router = Router(tags=["tickets (public)"])


@router.post("/interactions")
def interactions(request):
    if not panels.signed_by_discord(request.body, request.headers.get("X-Signature-Ed25519", ""), request.headers.get("X-Signature-Timestamp", "")):
        return HttpResponse("Invalid signature", status=401)
    return JsonResponse(panels.handle(json.loads(request.body)))
