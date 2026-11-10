from django.apps import apps
from django.core.management.base import BaseCommand
from django.db import connection, transaction

from conduit.accounts.crypto import EncryptedTextField, rotate
from conduit.accounts.models import Token


class Command(BaseCommand):
    help = (
        "Re-encrypt every stored SSO token with the current CONDUIT_TOKEN_KEY. Run it after setting the key for "
        "the first time or changing it (keep the old one in CONDUIT_TOKEN_KEY_PREVIOUS until this has run)."
    )

    def handle(self, *args, **options):
        # Every encrypted column of every installed app: the tokens, the EVE application's secret key entered on
        # the website, and whatever plugins keep (a Discord bot token, a TeamSpeak password). One left on the old
        # key could no longer be read once that key is taken out of CONDUIT_TOKEN_KEY_PREVIOUS.
        quote = connection.ops.quote_name
        done = 0
        others = 0
        with transaction.atomic(), connection.cursor() as cur:
            for model in apps.get_models():
                columns = [f.column for f in model._meta.local_concrete_fields if isinstance(f, EncryptedTextField)]
                if not columns:
                    continue
                table, pk = quote(model._meta.db_table), quote(model._meta.pk.column)
                # raw: skip the field's decryption
                cur.execute(f"SELECT {pk}, {', '.join(quote(c) for c in columns)} FROM {table}")
                for row_pk, *values in cur.fetchall():
                    changed = {c: rotate(v) for c, v in zip(columns, values) if v}
                    if not changed:
                        continue
                    cur.execute(f"UPDATE {table} SET {', '.join(f'{quote(c)} = %s' for c in changed)} WHERE {pk} = %s",
                                [*changed.values(), row_pk])
                    if model is Token:
                        done += 1
                    else:
                        others += 1
        self.stdout.write(self.style.SUCCESS(
            f"Re-encrypted {done} tokens and {others} other stored secrets with the current key."))
