"""What each kind of wallet journal entry is, in words people use. The one table of ref types -> categories.

Officers can move a ref type to another category (``CategoryOverride``) and tag money to or from someone
(``CounterpartyRule``); those win over this table. Ref types not listed here fall into ``OTHER``.
"""

RATTING = "Ratting tax"
MISSIONS = "Mission tax"
OTHER_TAX = "Other tax"
MARKET = "Market"
CONTRACTS = "Contracts"
INDUSTRY = "Industry"
PLANETARY = "Planetary"
STRUCTURES = "Structures"
SOVEREIGNTY = "Sovereignty"
WAR = "War"
TRANSFERS = "Transfers"
OTHER = "Other"

#: Built-in categories, in the order pages list them when nothing else decides.
GROUPS = (RATTING, MISSIONS, OTHER_TAX, MARKET, CONTRACTS, INDUSTRY, PLANETARY, STRUCTURES, SOVEREIGNTY, WAR, TRANSFERS, OTHER)

#: Money moved between the corporation's own divisions, or to and from the alliance's other corporations. Shown apart
#: so it doesn't count as income or spending. Not a category anyone can pick.
INTERNAL = "Internal transfers"

#: ESI journal ref type -> category.
REF_TYPES = {
    # The corporation's cut of members' ratting and missions.
    "bounty_prizes": RATTING,
    "bounty_prize": RATTING,
    "bounty_prize_corporation_tax": RATTING,
    "ess_escrow_transfer": RATTING,
    "agent_mission_reward": MISSIONS,
    "agent_mission_time_bonus_reward": MISSIONS,
    "agent_mission_reward_corporation_tax": MISSIONS,
    "agent_mission_time_bonus_reward_corporation_tax": MISSIONS,
    "corporate_reward_tax": OTHER_TAX,
    "corporate_reward_payout": OTHER_TAX,
    "project_discovery_tax": OTHER_TAX,
    "daily_goal_payouts_tax": OTHER_TAX,
    # Buying and selling on the market.
    "market_transaction": MARKET,
    "market_escrow": MARKET,
    "brokers_fee": MARKET,
    "transaction_tax": MARKET,
    "market_provider_tax": MARKET,
    "market_fine_paid": MARKET,
    # Contracts (every contract_* ref type, see PREFIXES) and courier escrow.
    "courier_mission_escrow": CONTRACTS,
    # Industry jobs in the corporation's structures, and the corporation's own jobs.
    "industry_job_tax": INDUSTRY,
    "manufacturing": INDUSTRY,
    "researching_material_productivity": INDUSTRY,
    "researching_time_productivity": INDUSTRY,
    "researching_technology": INDUSTRY,
    "copying": INDUSTRY,
    "reverse_engineering": INDUSTRY,
    "reaction": INDUSTRY,
    "reprocessing_tax": INDUSTRY,
    "datacore_fee": INDUSTRY,
    "factory_slot_rental_fee": INDUSTRY,
    "planetary_import_tax": PLANETARY,
    "planetary_export_tax": PLANETARY,
    "planetary_construction": PLANETARY,
    # Offices, gates, clones and other structure services.
    "office_rental_fee": STRUCTURES,
    "structure_gate_jump": STRUCTURES,
    "jump_clone_activation_fee": STRUCTURES,
    "jump_clone_installation_fee": STRUCTURES,
    "clone_activation": STRUCTURES,
    "docking_fee": STRUCTURES,
    "upkeep_adjustment_fee": STRUCTURES,
    "acceleration_gate_fee": STRUCTURES,
    "asset_safety_recovery_tax": STRUCTURES,
    "infrastructure_hub_maintenance": SOVEREIGNTY,
    "sovereignity_bill": SOVEREIGNTY,  # sic, as ESI spells it
    "alliance_maintainance_fee": SOVEREIGNTY,  # sic
    "war_fee": WAR,
    "war_fee_surrender": WAR,
    "war_ally_contract": WAR,
    # ISK given and taken by people: donations, director withdrawals, payments, dividends.
    "player_donation": TRANSFERS,
    "corporation_account_withdrawal": TRANSFERS,
    "corporation_payment": TRANSFERS,
    "corporation_bulk_payment": TRANSFERS,
    "corporation_dividend_payment": TRANSFERS,
    "player_trading": TRANSFERS,
    "shares": TRANSFERS,
}

#: Ref type prefixes -> category, for families with many members.
PREFIXES = (("contract_", CONTRACTS),)

#: Ref types that move ISK between corporations; with another corporation of the alliance they're internal.
TRANSFER_REF_TYPES = frozenset({"player_donation", "corporation_account_withdrawal", "corporation_payment", "corporation_bulk_payment"})


def default_category(ref_type: str) -> str:
    if ref_type in REF_TYPES:
        return REF_TYPES[ref_type]
    for prefix, category in PREFIXES:
        if ref_type.startswith(prefix):
            return category
    return OTHER


def ref_type_label(ref_type: str) -> str:
    """'office_rental_fee' -> 'Office rental fee'."""
    text = ref_type.replace("_", " ").strip()
    return text[:1].upper() + text[1:]
