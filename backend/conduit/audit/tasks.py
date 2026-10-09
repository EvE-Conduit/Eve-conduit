from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.utils import timezone

#: Rows per DELETE when purging old log rows.
PURGE_BATCH = 5000


@shared_task
def purge_logs():
    """Drop log rows older than their retention period (CONDUIT_*_LOG_DAYS; 0 keeps them forever)."""
    from conduit.esi.models import EsiCall
    from conduit.external.models import ApiRequest

    from .models import AuditEvent, ServiceLog, SnoopEvent

    now = timezone.now()
    removed = {}
    for model, days in (
        (AuditEvent, settings.CONDUIT_AUDIT_LOG_DAYS),
        (SnoopEvent, settings.CONDUIT_SNOOP_LOG_DAYS),
        (ServiceLog, settings.CONDUIT_SERVICE_LOG_DAYS),
        (ApiRequest, settings.CONDUIT_API_LOG_DAYS),
        (EsiCall, settings.CONDUIT_ESI_LOG_DAYS),
    ):
        if days > 0:
            removed[model.__name__] = _delete_in_batches(model.objects.filter(at__lt=now - timedelta(days=days)))
    return removed


def _delete_in_batches(qs) -> int:
    """Delete in short transactions: one DELETE of millions of ESI log rows would hold locks and grow the
    write-ahead log for minutes, and leave autovacuum one huge job instead of steady small ones."""
    removed = 0
    while pks := list(qs.values_list("pk", flat=True)[:PURGE_BATCH]):
        removed += qs.model.objects.filter(pk__in=pks).delete()[0]
    return removed
