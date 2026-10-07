from django.core.management.base import BaseCommand
from django.db import connection, transaction

from conduit.accounts.crypto import rotate
from conduit.accounts.models import Token


class Command(BaseCommand):
    help = (
        "Re-encrypt every stored SSO token with the current CONDUIT_TOKEN_KEY. Run it after setting the key for "
        "the first time or changing it (keep the old one in CONDUIT_TOKEN_KEY_PREVIOUS until this has run)."
    )

    def handle(self, *args, **options):
        table = Token._meta.db_table
        done = 0
        with transaction.atomic(), connection.cursor() as cur:
            cur.execute(f"SELECT id, access_token, refresh_token FROM {table}")  # raw: skip the field's decryption
            rows = cur.fetchall()
            for pk, access, refresh in rows:
                cur.execute(f"UPDATE {table} SET access_token = %s, refresh_token = %s WHERE id = %s",
                            [rotate(access), rotate(refresh), pk])
                done += 1
        self.stdout.write(self.style.SUCCESS(f"Re-encrypted {done} tokens with the current key."))
