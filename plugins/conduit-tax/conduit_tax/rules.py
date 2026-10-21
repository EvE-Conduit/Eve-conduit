"""Group rule: no corp tax bill left unpaid for longer than N days."""

from conduit.access.rules import Param, register_rule


def _paid_up(user, p):
    from .services import paid_up

    return paid_up(user, p["days"])


def _explain(p):
    return f"No corp tax unpaid for more than {p['days']} day{'s' if p['days'] != 1 else ''} after the bill"


register_rule(
    "tax_paid_up", "Corp tax paid", _paid_up, plugin="tax", category="Finance",
    params=(Param("days", "int", "Days to pay", default=14, min=0, max=365,
                  help="How long after a month is closed members have before an unpaid bill counts against them."),),
    description="Passes while the member has no unpaid corp tax bill older than the days to pay. Members who were "
                "never billed pass.",
    explain=_explain,
)
