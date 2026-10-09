import json

from django.core.management.base import BaseCommand, CommandError

from conduit.sheet.seat import history
from conduit.sheet.seat.dump import DumpError


class Command(BaseCommand):
    help = ("Bring every character's sheet data (wallet history, mail, killmails, skills, assets...) over from a dump "
            "of SeAT's database. Import the accounts first with the SeAT import program; safe to run again.")

    def add_arguments(self, parser):
        parser.add_argument("dump", help="SQL dump of SeAT's database (mariadb-dump, phpMyAdmin, HeidiSQL...)")
        parser.add_argument("--section", action="append", help="Only this section, e.g. wallet (repeatable)")
        parser.add_argument("--character", type=int, action="append", help="Only this character id (repeatable)")
        parser.add_argument("--staging", help="Where to keep the working copy (default: a temporary file)")
        parser.add_argument("--keep-staging", action="store_true", help="Don't delete the working copy afterwards")
        parser.add_argument("--no-names", action="store_true", help="Don't look up missing names with EVE afterwards")
        parser.add_argument("--report", help="Write the summary to this JSON file")

    def handle(self, *args, dump, section=None, character=None, staging=None, keep_staging=False, no_names=False,
               report=None, **options):
        try:
            summary = history.run(dump, sections=section, character_ids=character, staging_path=staging,
                                  keep_staging=keep_staging or bool(staging), lookup_names=not no_names,
                                  say=self.stdout.write)
        except (DumpError, ValueError) as exc:
            raise CommandError(str(exc)) from None
        self.stdout.write("")
        for key, counts in sorted(summary["sections"].items()):
            self.stdout.write(f"  {key:15} {counts['imported']:>6} imported  {counts['skipped']:>6} skipped "
                              f"{counts['errors']:>6} errors")
        if report:
            with open(report, "w", encoding="utf-8") as fh:
                json.dump(summary, fh, indent=2)
            self.stdout.write(f"Summary written to {report}")
        if summary["errors"]:
            self.stdout.write(self.style.WARNING(f"{len(summary['errors'])} section imports failed; see above."))
        else:
            self.stdout.write(self.style.SUCCESS("Done."))
        self.stdout.write("Delete the dump when you're finished: it holds working logins for every character in it.")
