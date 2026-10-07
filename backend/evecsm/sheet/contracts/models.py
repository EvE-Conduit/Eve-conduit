from django.db import models


class Contract(models.Model):
    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="contracts")
    contract_id = models.BigIntegerField()
    type = models.CharField(max_length=20)
    status = models.CharField(max_length=30, db_index=True)
    title = models.CharField(max_length=200, blank=True)
    availability = models.CharField(max_length=20)
    for_corporation = models.BooleanField(default=False)
    issuer_id = models.BigIntegerField()
    issuer_corporation_id = models.BigIntegerField()
    assignee_id = models.BigIntegerField()
    acceptor_id = models.BigIntegerField()
    price = models.DecimalField(max_digits=20, decimal_places=2, null=True)
    reward = models.DecimalField(max_digits=20, decimal_places=2, null=True)
    collateral = models.DecimalField(max_digits=20, decimal_places=2, null=True)
    buyout = models.DecimalField(max_digits=20, decimal_places=2, null=True)
    volume = models.FloatField(null=True)
    days_to_complete = models.IntegerField(null=True)
    start_location_id = models.BigIntegerField(null=True)
    end_location_id = models.BigIntegerField(null=True)
    date_issued = models.DateTimeField(db_index=True)
    date_expired = models.DateTimeField()
    date_accepted = models.DateTimeField(null=True)
    date_completed = models.DateTimeField(null=True)
    items_fetched = models.BooleanField(default=False)

    class Meta:
        unique_together = [("character", "contract_id")]
        ordering = ["-date_issued"]


class ContractItem(models.Model):
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name="items")
    record_id = models.BigIntegerField()
    type_id = models.IntegerField()
    quantity = models.IntegerField()
    is_included = models.BooleanField()
    is_singleton = models.BooleanField()
    raw_quantity = models.IntegerField(null=True)
