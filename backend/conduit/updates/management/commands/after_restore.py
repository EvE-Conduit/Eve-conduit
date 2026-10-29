from django.core.cache import cache
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = (
        "Run by 'conduit restore' once the database is back and migrated: empties the cache (it holds what the "
        "replaced database said; with Redis or Garnet this also drops queued background jobs, which pointed at it) "
        "and notes the restore in the audit log of the restored database."
    )

    def add_arguments(self, parser):
        parser.add_argument("backup", help="the backup's file name")
        parser.add_argument("--requested-by", default="", help="who asked for it on the website")

    def handle(self, *args, backup, requested_by, **options):
        from conduit.audit.services import record

        cache.clear()
        asked = f", as asked by {requested_by}" if requested_by else ""
        record("backup.restored", f"restored the database from the backup {backup}{asked}", target_type="backup",
               details={"backup": backup, "requested_by": requested_by})
        self.stdout.write(f"Restored {backup}.")
