"""Run on every start (after migrate). Safe to repeat."""

from django.conf import settings
from django.core.management.base import BaseCommand

from evecsm.access.models import State
from evecsm.esi.tokens import sso_configured
from evecsm.modules.services import sync_installed
from evecsm.sde.models import SdeVersion
from evecsm.site.models import SiteSettings


class Command(BaseCommand):
    help = "Create default data, register installed modules and print the setup code on first run"

    def handle(self, *args, **options):
        site = SiteSettings.load()
        if not State.objects.exists():
            State.objects.create(name="Guest", priority=0, public=True, description="Anyone who signs in")
            self.stdout.write("Created the default Guest state")
        sync_installed()

        if not SdeVersion.objects.exists():
            from evecsm.eve.tasks import update_market_prices
            from evecsm.sde.tasks import update_sde

            self.stdout.write("No EVE static data yet; importing it (about a minute)...")
            update_sde.delay()
            update_market_prices.delay()

        if not settings.ESI_USER_AGENT_CONTACT:
            self.stdout.write(
                self.style.WARNING(
                    "ESI_USER_AGENT_CONTACT is empty. CCP asks every ESI application to identify itself; "
                    "set it to an email address (it is sent in the User-Agent header)."
                )
            )
        if not sso_configured():
            self.stdout.write(self.style.WARNING("ESI_CLIENT_ID / ESI_SECRET_KEY are not set; EVE login is off."))
        if not site.setup_completed:
            bar = "=" * 64
            self.stdout.write(
                self.style.SUCCESS(
                    f"\n{bar}\n  EVECSM first-run setup code: {site.setup_token}\n"
                    f"  Sign in, then enter this code in the setup wizard to become admin.\n{bar}\n"
                )
            )
