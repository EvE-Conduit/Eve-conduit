from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.utils import timezone


@shared_task
def purge_logs():
    """Drop log rows older than their retention period (CONDUIT_*_LOG_DAYS; 0 keeps them forever)."""
    from conduit.esi.models import EsiCall
    from conduit.external.models import ApiRequest

    from .models import AuditEvent, ServiceLog

    now = timezone.now()
    removed = {}
    for model, days in (
        (AuditEvent, settings.CONDUIT_AUDIT_LOG_DAYS),
        (ServiceLog, settings.CONDUIT_SERVICE_LOG_DAYS),
        (ApiRequest, settings.CONDUIT_API_LOG_DAYS),
        (EsiCall, settings.CONDUIT_ESI_LOG_DAYS),
    ):
        if days > 0:
            removed[model.__name__] = model.objects.filter(at__lt=now - timedelta(days=days)).delete()[0]
    return removed
