from django.core.management.base import BaseCommand, CommandError

from conduit.accounts.models import Character
from conduit.sheet import registry
from conduit.sheet.tasks import sync_section


class Command(BaseCommand):
    help = "Sync character sheet sections right now (in this process)"

    def add_arguments(self, parser):
        parser.add_argument("--character", type=int, action="append", help="Character id (repeatable). Default: all")
        parser.add_argument("--section", action="append", help="Section key, e.g. skills (repeatable). Default: all")

    def handle(self, *args, character=None, section=None, **options):
        sections = section or list(registry.synced())
        unknown = set(sections) - set(registry.synced())
        if unknown:
            raise CommandError(f"Unknown section(s): {', '.join(unknown)}")
        qs = Character.objects.all()
        if character:
            qs = qs.filter(pk__in=character)
        for char in qs:
            for key in sections:
                result = sync_section.apply(args=[char.pk, key]).get(propagate=False)
                self.stdout.write(f"{char.name:30} {key:15} {result}")
