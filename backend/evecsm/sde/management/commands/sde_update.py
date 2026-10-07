from pathlib import Path

from django.core.management.base import BaseCommand

from evecsm.sde import importer


class Command(BaseCommand):
    help = "Import the latest EVE Static Data Export (only if a newer build exists)"

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true", help="Re-import even if this build is already imported")
        parser.add_argument("--file", type=Path, help="Import a downloaded JSONL zip instead of fetching one")

    def handle(self, *args, force=False, file=None, **options):
        importer.update(force=force, archive=file, progress=self.stdout.write)
