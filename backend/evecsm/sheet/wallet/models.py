from django.db import models


class WalletBalance(models.Model):
    character = models.OneToOneField("accounts.Character", primary_key=True, on_delete=models.CASCADE, related_name="wallet")
    balance = models.DecimalField(max_digits=20, decimal_places=2)
    updated_at = models.DateTimeField(auto_now=True)


class JournalEntry(models.Model):
    """A wallet journal line. ``ref_id`` is shared by both sides of a transfer."""

    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="journal")
    ref_id = models.BigIntegerField()
    date = models.DateTimeField(db_index=True)
    ref_type = models.CharField(max_length=60, db_index=True)
    amount = models.DecimalField(max_digits=20, decimal_places=2, null=True)
    balance = models.DecimalField(max_digits=20, decimal_places=2, null=True)
    description = models.CharField(max_length=500, blank=True)
    reason = models.CharField(max_length=500, blank=True)
    first_party_id = models.BigIntegerField(null=True)
    second_party_id = models.BigIntegerField(null=True)
    context_id = models.BigIntegerField(null=True)
    context_id_type = models.CharField(max_length=40, blank=True)
    tax = models.DecimalField(max_digits=20, decimal_places=2, null=True)

    class Meta:
        unique_together = [("character", "ref_id")]
        ordering = ["-date", "-ref_id"]


class WalletTransaction(models.Model):
    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="transactions")
    transaction_id = models.BigIntegerField()
    date = models.DateTimeField(db_index=True)
    type_id = models.IntegerField()
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=20, decimal_places=2)
    is_buy = models.BooleanField()
    is_personal = models.BooleanField(default=True)
    client_id = models.BigIntegerField()
    location_id = models.BigIntegerField()
    journal_ref_id = models.BigIntegerField(null=True)

    class Meta:
        unique_together = [("character", "transaction_id")]
        ordering = ["-date", "-transaction_id"]
