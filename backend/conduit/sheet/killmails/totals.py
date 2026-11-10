from django.db.models import Count, Sum


def killmail_totals(links) -> dict:
    """Kills, losses and their ISK for a queryset of character or corporation killmail links, added up by the
    database: loading every killmail (with its stored JSON) just to count them doesn't scale."""
    out = {"kills": 0, "losses": 0, "isk_destroyed": 0, "isk_lost": 0}
    for row in links.values("is_loss").annotate(n=Count("pk"), isk=Sum("killmail__value")):
        count, isk = ("losses", "isk_lost") if row["is_loss"] else ("kills", "isk_destroyed")
        out[count], out[isk] = row["n"], row["isk"] or 0
    return out
