"""Mail, in-game notifications, the calendar, contacts and NPC standings.

Mail is stored as ESI lists it: one copy for every character that has it (sender and recipients, everyone in a
corporation or alliance it went to, the members of a mailing list), so Member Audit shows who holds each one.
"""

from datetime import timedelta

from conduit.eve.models import EveName
from conduit.sheet.calendar.models import CalendarEvent
from conduit.sheet.contacts.models import Contact
from conduit.sheet.mail.models import Mail, MailLabel
from conduit.sheet.notifications.models import Notification
from conduit.sheet.standings.models import Standing

from .sheet_combat import HOSTILE_ALLIANCE, HOSTILE_ALLIANCES, HOSTILE_CORPORATION, hostiles
from .sheet_industry import neutrals, research_agents, role

INBOX, SENT, CORP, ALLIANCE = 1, 2, 4, 8
FLEET_LABEL, INDUSTRY_LABEL = 16, 32  # the demo account's own labels

FACTIONS = {500001: "Caldari State", 500002: "Minmatar Republic", 500003: "Amarr Empire", 500004: "Gallente Federation",
            500010: "Guristas Pirates", 500011: "Angel Cartel", 500012: "Blood Raider Covenant", 500019: "Sansha's Nation",
            500020: "Serpentis"}
NPC_CORPORATIONS = {1000035: "Caldari Navy", 1000125: "CONCORD", 1000127: "Guristas", 1000135: "Serpentis Corporation",
                    1000179: "24th Imperial Crusade", 1000180: "State Protectorate", 1000181: "Federal Defense Union",
                    1000182: "Tribal Liberation Force"}
EMPIRES = (500001, 500002, 500003, 500004)
CONCORD = 1000125


def seed(demo):
    EveName.objects.bulk_create(
        [EveName(id=i, name=n, category="faction") for i, n in FACTIONS.items()]
        + [EveName(id=i, name=n, category="corporation") for i, n in NPC_CORPORATIONS.items()],
        ignore_conflicts=True,
    )
    enemies, outsiders = hostiles(demo), neutrals(demo)
    _mail(demo, outsiders)
    _notifications(demo, enemies, outsiders)
    _calendar(demo)
    _contacts(demo, enemies, outsiders)
    _standings(demo)


# --- mail ---------------------------------------------------------------------------------------------------------

ALLIANCE_MAILS = (
    ("Stratop summary: autumn deployment",
     "Thanks to everyone who made it to the stratop.\n\nThe short version:\n- We stay in Perimeter for industry and "
     "trade; the Keepstar market keeps running.\n- Starfall Vanguard sets up staging in Rens for the Ashen Tide "
     "campaign.\n- Capital pilots: get your carriers and dreads to Rens by the end of next week.\n\nQuestions go "
     "to your CEO or the FC channel. Fly safe."),
    ("War declaration: Ashen Tide Concord",
     "Ashen Tide Concord has declared war on the alliance. It goes live in 24 hours.\n\nUntil it's over: no "
     "solo hauling in Jita or Perimeter, use the Deep Void Logistics courier service. Keep your clones in "
     "Rens up to date, and check local before you undock.\n\nWe'll have fleets up every evening."),
    ("SRP policy update",
     "Ship replacement is changing a little:\n- Doctrine ships lost on an alliance fleet: 100% of the hull and "
     "fit.\n- Non-doctrine ships on a CTA: 50%.\n- Roams and solo: no SRP, sorry.\n\nFile your losses on the "
     "site within a week of the fleet, with the killmail link."),
    ("Keepstar market: fuel drive this weekend",
     "The Northern Lights Keepstar Market burns more fuel than we like. This weekend we're hauling fuel blocks "
     "in from Jita: every courier contract to the Keepstar gets a 20% bonus on the reward.\n\nIndustrialists: "
     "if you can build fuel blocks, contact the Aurora Industries directors."),
    ("Doctrine update: Hurricane fleet",
     "New Hurricane fits are on the doctrines page. The main change: 125mm Gatling AutoCannons for tracking, and "
     "Hammerheads for drones.\n\nAurora Industries has fitted Hurricanes on contract in Perimeter at cost."),
    ("Reminder: keep your ESI tokens up to date",
     "A few of you have lapsed tokens on the alliance site. Please sign in and add your characters again, or you'll "
     "drop out of the groups and pings that need them.\n\nThe Compliance page shows who's missing."),
    ("Moon extraction schedule - Hek",
     "The Hek - Deep Void Refinery has an extraction coming up every week. Chunks pop at downtime +2h; look for "
     "the calendar event.\n\nOre goes to the buyback at 90% of Jita. Bring an Orca if you have one."),
    ("Welcome to our new members",
     "A warm welcome to everyone who joined this month. Read the alliance wiki, join the fleet pings mailing list, "
     "and say hello on comms.\n\nIf you're unsure where to start, the Mentoring group pairs you with someone "
     "who's been around."),
)
CORP_MAILS = {
    0: (("Welcome to Aurora Industries",
         "Welcome aboard. Aurora Industries builds the alliance's ships and runs the Perimeter Raitaru.\n\nYour "
         "first week: set up your clone in Perimeter, get your ESI tokens on the alliance site and pick up the "
         "free Procurer contract from the directors."),
        ("Build list for the week",
         "This week we need:\n- 20 Hurricanes\n- 30 Caracals\n- 500 Hammerhead I\n- 40 000 EMP S\n\nMaterials are "
         "in the corp hangar of the Aurora Forge. Put finished ships on contract to the alliance at cost."),
        ("Corp tax goes to 10%",
         "From the first of next month corp tax goes from 8% to 10%. The extra pays for the Keepstar's fuel. Thanks "
         "for understanding.")),
    1: (("Saturday roam: meet in Rens",
         "Saturday 18:00 EVE we roam out of Rens. Frigates and destroyers; Rifters are on contract for free. "
         "Bring a probe launcher if you can."),
        ("Clone check",
         "Please set your home station to Rens before the war goes live. Jump clones in Perimeter are fine.")),
    2: (("Courier rates",
         "Our courier rates for alliance members:\n- Jita -> Perimeter: 600 ISK/m3, collateral up to 3b\n- Jita -> "
         "Rens: 900 ISK/m3\n\nPut contracts to Deep Void Logistics, not to a pilot."),
        ("Refinery output",
         "The Hek refinery runs at full speed. Haulers: there's a stack of minerals for Jita every Tuesday.")),
}
FLEET_PINGS = (
    ("Fleet up: Hurricane doctrine, Rens 19:00 EVE", "Form up in Rens at 19:00 EVE. Hurricanes and Basilisks, "
     "logi bring cap boosters. X up in fleet chat. Comms: Fleet 1."),
    ("CTA: Rens - Starfall Staging armor timer", "CTA. The Astrahus in Rens comes out of armor at 20:30 EVE. "
     "All doctrines welcome, capitals on standby. This is the big one, everyone please show."),
    ("Home defence: Ashen Tide gang in Hek", "About 15 Ashen Tide in Hek, mostly Thoraxes and Stabbers. Caracal "
     "fleet forming in Perimeter right now."),
    ("Mining fleet with Orca boosts", "Hek belts, 17:00 EVE. Orca boosts and a couple of Caracals for cover. "
     "Bring your barges."),
    ("Weekend roam: frigates", "Frigate roam out of Rens, 15:00 EVE on Sunday. Rifters on contract."),
)
INDUSTRY_LIST = (
    ("Ore buyback rates for this week", "Buyback pays 90% of Jita for ore and minerals this week, 92% for Kernite "
     "and Omber. Contract to Aurora Industries at the Aurora Forge."),
    ("PI: who has spare Mechanical Parts?", "We need about 5 000 Mechanical Parts for the next Procurer batch. "
     "Paying Jita sell. Contract them to me in Perimeter."),
)
PERSONAL = (
    ("Can you build me 5 Drakes?", "Hey, could you put 5 Drakes in the build queue? I'll bring the minerals to the "
     "Aurora Forge tomorrow. Thanks!"),
    ("Orca boosts tonight?", "Are you around tonight for boosts in Hek? A few of us want to mine for a couple of hours."),
    ("SRP request: Hurricane", "Lost my Hurricane on last night's CTA. The killmail is on the site. Thanks for "
     "looking at it."),
    ("Courier contract up", "Put up a courier contract to the Keepstar: about 60 000 m3 of minerals. Reward's "
     "generous, the collateral's high, so take it if you've got the time."),
    ("PI handover while I'm away", "I'm away for two weeks. My extractors on the Hek planets run out on Thursday; "
     "could you reset them? I've left the details in the corp wiki."),
    ("Thanks for the welcome!", "Just wanted to say thanks for the welcome and the Procurer. Moved everything to "
     "Perimeter today."),
    ("Re: research agents", "The Laser Physics agent in Perimeter is the best one for us. It gives a couple of "
     "datacores a day once your standing is up."),
    ("Fleet comp for Saturday", "How many logi do we want for Saturday? I can bring a Basilisk or a Guardian."),
    ("Spare Hammerheads", "I have 200 Hammerhead I left from the last batch. Want them for the doctrine contracts?"),
)
OUTSIDER_MAILS = (
    ("Application to Aurora Industries", "Hi! I've played for about a year, mostly mining and PI in Metropolis. "
     "I'm looking for a corp with real industry. My API is on your site. Can we talk on comms?"),
    ("Freight to Perimeter", "We've seen you move a lot of freight Jita -> Perimeter. Saltmarsh Freight does it at "
     "500 ISK/m3 with collateral up to 5b. Let us know."),
    ("Re: Hammerhead II buy order", "Is your buy order for Hammerhead II in Jita still up? I have 300 to sell."),
)


def _mail(demo, outsiders):
    alliance_chars = [c for c in demo.characters if c.alliance_id == demo.alliance.pk]
    by_corp = {corp.pk: [c for c in demo.characters if c.corporation_id == corp.pk] for corp in demo.corporations}
    star = demo.admin.main_character
    admins = demo.characters_of(demo.admin)
    leaders = [star] + [u.main_character for u in demo.users[1:4]]
    fleet_list, industry_list = demo.next_id(), demo.next_id()
    EveName.objects.bulk_create([EveName(id=fleet_list, name="NLC Fleet Pings", category="mailing_list"),
                                 EveName(id=industry_list, name="AURI Industry", category="mailing_list")], ignore_conflicts=True)
    fleet_members = admins + [c for c in alliance_chars if c.user_id != demo.admin.pk and demo.chance(0.7)]
    industry_members = admins + [c for c in by_corp[demo.corporations[0].pk] if c.user_id != demo.admin.pk and demo.chance(0.6)]
    rows = []

    def send(sender_id, to, holders, subject, body, when, label):
        """``to``: [(recipient id, type)]; ``holders``: the registered characters that get a copy."""
        mail_id = demo.next_id()
        recipients = [{"recipient_id": i, "recipient_type": t} for i, t in to]
        for c in {c.pk: c for c in holders}.values():
            mine = c.pk == sender_id
            age = (demo.now - when).total_seconds() / 86400
            labels = [SENT] if mine else [label] if label else []
            if c.user_id == demo.admin.pk and not mine:
                labels += [FLEET_LABEL] if to[0][0] == fleet_list else [INDUSTRY_LABEL] if to[0][0] == industry_list else []
            rows.append(Mail(
                character=c, mail_id=mail_id, sender_id=sender_id, subject=subject, timestamp=when, labels=labels,
                is_read=mine or demo.chance(0.95 if age > 4 else 0.45), recipients=recipients, body=body, body_fetched=True,
            ))

    for i, (subject, body) in enumerate(ALLIANCE_MAILS):
        send(demo.pick(leaders).pk, [(demo.alliance.pk, "alliance")], alliance_chars, subject, body,
             demo.ago(days=45 - i * 5.5, hours=demo.rng.uniform(0, 6)), ALLIANCE)
    for n, mails in CORP_MAILS.items():
        if n >= len(demo.corporations):
            continue
        corp = demo.corporations[n]
        ceo = star if n == 0 else by_corp[corp.pk][0]
        for subject, body in mails:
            send(ceo.pk, [(corp.pk, "corporation")], by_corp[corp.pk], subject, body, demo.recent(40), CORP)
    for _ in range(3):
        for subject, body in FLEET_PINGS:
            send(demo.pick(leaders).pk, [(fleet_list, "mailing_list")], fleet_members, subject, body, demo.recent(30), None)
    for subject, body in INDUSTRY_LIST:
        send(star.pk, [(industry_list, "mailing_list")], industry_members, subject, body, demo.recent(20), None)

    # Members writing to the demo account, and it answering some of them.
    mates = [c for c in alliance_chars if c.user_id != demo.admin.pk]
    for subject, body in PERSONAL:
        sender = demo.pick(mates)
        when = demo.recent(25)
        send(sender.pk, [(star.pk, "character")], [sender, star], subject, body, when, INBOX)
        if demo.chance(0.5):
            send(star.pk, [(sender.pk, "character")], [star, sender], f"Re: {subject}",
                 f"Sure, I'll sort it out.\n\n--- {sender.name} wrote ---\n{body}", when + timedelta(hours=demo.rng.uniform(1, 20)), INBOX)
    for (subject, body), (who, _) in zip(OUTSIDER_MAILS, demo.sample(outsiders, len(OUTSIDER_MAILS))):
        send(who, [(star.pk, "character")], [star], subject, body, demo.recent(14), INBOX)
    for c in demo.sample(mates, 6):
        send(star.pk, [(c.pk, "character")], [star, c], f"Welcome, {c.name}",
             "Good to have you with us. Ping me in game if you need anything: ships, a hand with industry, or just "
             "directions to Perimeter.", demo.recent(60), INBOX)
    # And to each other, so every sheet has a few personal mails.
    for c in demo.characters:
        if role(demo, c) in ("main", "alt") and c.alliance_id:
            for _ in range(demo.rng.randint(1 if role(demo, c) == "main" else 0, 3)):
                other = demo.pick(mates)
                if other.pk != c.pk:
                    subject, body = demo.pick(PERSONAL)
                    send(c.pk, [(other.pk, "character")], [c, other], subject, body, demo.recent(40), INBOX)
    # Pilots outside the alliance: a mail from their own corporation, and a trader's offer.
    others = [c for c in demo.characters if c.alliance_id != demo.alliance.pk]
    for corp_id in dict.fromkeys(c.corporation_id for c in others):
        members = [c for c in others if c.corporation_id == corp_id]
        send(members[0].pk, [(corp_id, "corporation")], members, "Joint op with the Northern Lights Coalition",
             "The Coalition invited us along on their Saturday fleets. Bring a Caracal and x up in their channel.", demo.recent(20), CORP)
    for c in others:
        subject, body = OUTSIDER_MAILS[2]
        send(demo.pick(outsiders)[0], [(c.pk, "character")], [c], subject, body, demo.recent(10), INBOX)
    Mail.objects.bulk_create(rows, batch_size=2000)

    names = {INBOX: "Inbox", SENT: "Sent", CORP: "[Corp]", ALLIANCE: "[Alliance]", FLEET_LABEL: "Fleet ops", INDUSTRY_LABEL: "Industry"}
    colors = {FLEET_LABEL: "#f97316", INDUSTRY_LABEL: "#22c55e"}
    unread: dict[tuple, int] = {}
    for m in rows:
        if not m.is_read:
            for lab in m.labels:
                unread[(m.character.pk, lab)] = unread.get((m.character.pk, lab), 0) + 1
    MailLabel.objects.bulk_create([
        MailLabel(character=c, label_id=lab, name=names[lab], color=colors.get(lab, "#ffffff"), unread=unread.get((c.pk, lab), 0))
        for c in demo.characters
        for lab in (INBOX, SENT, CORP, ALLIANCE, *((FLEET_LABEL, INDUSTRY_LABEL) if c.user_id == demo.admin.pk else ()))
    ])


# --- notifications --------------------------------------------------------------------------------------------------


def _filetime(when) -> int:
    """Notification bodies give times as Windows file times."""
    return int((when.timestamp() + 11_644_473_600) * 10_000_000)


def _notifications(demo, enemies, outsiders):
    star = demo.admin.main_character
    corp, alliance = demo.corporations[0], demo.alliance
    structures = demo.structures
    rows = []

    def note(character, kind, text, when, sender=CONCORD, sender_type="corporation"):
        rows.append(Notification(character=character, notification_id=demo.next_id(), type=kind, sender_id=sender,
                                 sender_type=sender_type, timestamp=when, is_read=demo.chance(0.9 if when < demo.ago(days=2) else 0.3),
                                 text=text))

    def structure(s):
        return (f"solarsystemID: {s['system_id']}\nstructureID: &id001 {s['id']}\nstructureShowInfoData:\n- showinfo\n"
                f"- {s['type_id']}\n- *id001\nstructureTypeID: {s['type_id']}\n")

    hostile_alliance = HOSTILE_ALLIANCE + HOSTILE_ALLIANCES[0][1]
    war_start = demo.ago(days=19)
    for c in demo.characters:
        if c.alliance_id == alliance.pk:
            note(c, "AllWarDeclaredMsg", f"againstID: {alliance.pk}\ncost: 0\ndeclaredByID: {hostile_alliance}\ndelayHours: 24\nhostileState: 0\n",
                 war_start)
        note(c, "CharAppAcceptMsg", f"applicationText: ''\ncharID: {c.pk}\ncorpID: {c.corporation_id}\n", c.added_at)
        if c.corporation_id == corp.pk:
            note(c, "CorpTaxChangeMsg", f"corpID: {corp.pk}\nnewTaxRate: 0.1\noldTaxRate: 0.08\n", demo.ago(days=9), sender=corp.pk)

    for c in demo.characters_of(demo.admin):
        for s in structures:
            note(c, "StructureFuelAlert", f"listOfTypesAndQty:\n- - {demo.rng.randint(200, 1200)}\n  - 4246\n" + structure(s), demo.recent(20),
                 sender=corp.pk)
    rens = next((s for s in structures if s["system_id"] == 30002510), structures[-1])
    for _ in range(4):
        attacker, attacker_corp, attacker_alliance = demo.pick([e for e in enemies if e[2]])
        names = dict(EveName.objects.filter(pk__in=[attacker_corp, attacker_alliance]).values_list("id", "name"))
        shield = round(demo.rng.uniform(0, 95), 1)
        note(star, "StructureUnderAttack",
             f"allianceID: {attacker_alliance}\nallianceLinkData:\n- showinfo\n- 16159\n- {attacker_alliance}\nallianceName: "
             f"{names.get(attacker_alliance, '')}\narmorPercentage: 100.0\ncharID: {attacker}\ncorpLinkData:\n- showinfo\n- 2\n"
             f"- {attacker_corp}\ncorpName: {names.get(attacker_corp, '')}\nhullPercentage: 100.0\nshieldPercentage: {shield}\n"
             + structure(rens), demo.recent(18))
    note(star, "StructureServicesOffline", "listOfServiceModuleIDs:\n- 35892\n" + structure(structures[0]), demo.recent(10))
    refinery = next((s for s in structures if s["type_id"] == 35835), None)
    if refinery:
        for week in range(4):
            when = demo.ago(days=week * 7 + 1.5)
            note(star, "MoonminingExtractionFinished",
                 f"autoTime: {_filetime(when + timedelta(hours=3))}\nmoonID: 40130{week}12\noreVolumeByType:\n  45490: "
                 f"{demo.rng.randint(900_000, 2_000_000)}.0\n  45491: {demo.rng.randint(400_000, 900_000)}.0\n"
                 f"solarSystemID: {refinery['system_id']}\nstructureID: {refinery['id']}\nstructureName: {refinery['name']}\n"
                 f"structureTypeID: {refinery['type_id']}\n", when, sender=corp.pk)
    note(star, "StructureAnchoring",
         f"ownerCorpLinkData:\n- showinfo\n- 2\n- {HOSTILE_CORPORATION + 1}\nownerCorpName: Ashen Tide Marauders\n"
         f"solarsystemID: 30002510\nstructureTypeID: 35832\ntimeLeft: {24 * 3600 * 10_000_000}\nvulnerableTime: 9000000000\n", demo.recent(6))
    for who, _ in demo.sample(outsiders, 4):
        note(star, "CorpAppNewMsg",
             f"applicationText: 'Hi, I mine and do PI and I''m looking for a home. Happy to haul too.'\ncharID: {who}\ncorpID: {corp.pk}\n",
             demo.recent(12), sender=who, sender_type="character")
    leaver = demo.pick(outsiders)[0]
    note(star, "CharLeftCorpMsg", f"charID: {leaver}\ncorpID: {corp.pk}\n", demo.recent(25), sender=leaver, sender_type="character")
    for month in (1, 0):
        when = demo.ago(days=month * 30 + 3)
        note(star, "CorpAllBillMsg",
             f"amount: {demo.rng.randint(20, 60) * 1_000_000}\nbillTypeID: 7\ncreditorID: {CONCORD}\ncurrentDate: {_filetime(when)}\n"
             f"debtorID: {alliance.pk}\ndueDate: {_filetime(when + timedelta(days=30))}\nexternalID: -1\nexternalID2: -1\n", when)
    for c in demo.characters:
        if c.alliance_id == alliance.pk and demo.chance(0.4 if role(demo, c) in ("main", "alt") else 1):
            for _ in range(demo.rng.randint(1, 4)):
                note(c, "BountyClaimMsg", f"amount: {demo.rng.randint(50, 900) * 10_000}.0\nitemID: {demo.next_id()}\npayout: 1\n", demo.recent(30))
    Notification.objects.bulk_create(rows, batch_size=2000)


# --- calendar ------------------------------------------------------------------------------------------------------

# days from now, title, important, duration (minutes), owner ("alliance", a corporation number, "admin", "server"), text
EVENTS = (
    (-26, "Stratop: autumn deployment", False, 90, "alliance", "Plans for the autumn: deployment to Rens and the Keepstar fuel."),
    (-18, "CTA: Rens - Starfall Staging armor timer", True, 120, "alliance", "Everyone who can undock. Doctrine fleet, capitals on standby."),
    (-12, "Mining op: Hek belts", False, 180, 0, "Orca boosts provided. Ore goes to the buyback."),
    (-6, "Saturday roam", False, 150, 1, "Frigates out of Rens. Rifters on contract."),
    (-3, "Freight run: Jita restock", False, 120, 2, "Restocking the Keepstar market. Freighters, please."),
    (-1, "Moon extraction: Hek - Deep Void Refinery", False, 60, 2, "Chunk pops at downtime +2h."),
    (0.3, "Doctrine practice: Hurricane fleet", False, 90, "alliance", "Practice anchoring and broadcasts. New pilots welcome."),
    (1.4, "CTA: Perimeter - Aurora Forge hull timer", True, 120, "alliance", "Ashen Tide reinforced the Raitaru. We defend it."),
    (3, "Mining op: Hek belts", False, 180, 0, "Same as always: bring your barges."),
    (4, "New member Q&A on comms", False, 60, "admin", "Ask the directors anything. Fleet 1 on comms."),
    (6, "Moon extraction: Hek - Deep Void Refinery", False, 60, 2, "Chunk pops at downtime +2h."),
    (8, "Stratop: winter plans", False, 90, "alliance", "Where we go after the war. All members welcome."),
    (12, "Alliance birthday fleet", False, 180, "alliance", "Fireworks in Perimeter, then a roam. Every ship welcome."),
    (16, "Saturday roam", False, 150, 1, "Frigates out of Rens."),
    (2, "Extended downtime", False, 120, "server", "The servers are down longer than usual for maintenance."),
)


def _calendar(demo):
    star = demo.admin.main_character
    corps = demo.corporations
    rows = []
    for offset, title, important, duration, owner, text in EVENTS:
        event_id = demo.next_id()
        when = (demo.now + timedelta(days=offset)).replace(minute=0, second=0, microsecond=0)
        if owner == "alliance":
            owner_name, owner_type = demo.alliance.name, "alliance"
            invited = [c for c in demo.characters if c.alliance_id == demo.alliance.pk]
        elif owner == "admin":
            owner_name, owner_type = star.name, "character"
            invited = [c for c in demo.characters if c.corporation_id == corps[0].pk]
        elif owner == "server":
            owner_name, owner_type, invited = "EVE System", "eve_server", demo.characters
        elif owner < len(corps):
            owner_name, owner_type = corps[owner].name, "corporation"
            invited = [c for c in demo.characters if c.corporation_id == corps[owner].pk or c.user_id == demo.admin.pk]
        else:
            continue
        for c in invited:
            if offset < 0:
                response = demo.rng.choices(["accepted", "declined", "tentative", "not_responded"], weights=[6, 1, 1, 2])[0]
            else:
                response = demo.rng.choices(["accepted", "tentative", "not_responded"], weights=[3, 1, 4])[0]
            rows.append(CalendarEvent(
                character=c, event_id=event_id, date=when, title=title, importance=int(important),
                response="" if owner == "server" else response, duration=duration, owner_name=owner_name,
                owner_type=owner_type, text=text, detail_fetched=True,
            ))
    CalendarEvent.objects.bulk_create(rows, batch_size=2000)


# --- contacts and standings --------------------------------------------------------------------------------------------


def _contacts(demo, enemies, outsiders):
    blue_alliance = demo.blue_corporation.alliance_id
    rows = []
    for c in demo.characters:
        r = role(demo, c)
        ours = c.alliance_id == demo.alliance.pk
        entries = {}  # contact id -> (type, standing, watched, blocked, labels)
        if ours:
            entries[blue_alliance] = ("alliance", 10.0, False, False, ["Blues"])
        elif c.alliance_id:
            entries[demo.alliance.pk] = ("alliance", 10.0, False, False, ["Blues"])
        for _, alliance_no in HOSTILE_ALLIANCES:
            if ours or demo.chance(0.3):
                entries[HOSTILE_ALLIANCE + alliance_no] = ("alliance", -10.0, False, False, ["Hostiles"])
        if ours:
            entries[HOSTILE_CORPORATION + 5] = ("corporation", -5.0, False, False, ["Hostiles"])
        many = r in ("star", "admin")
        for pilot, *_ in demo.sample(enemies, 12 if r == "star" else 4 if many else demo.rng.randint(0, 3)):
            entries[pilot] = ("character", demo.pick([-10.0, -10.0, -5.0]), demo.chance(0.6), demo.chance(0.1), ["Hostiles"])
        for who, _ in demo.sample(outsiders, 6 if r == "star" else demo.rng.randint(0, 2)):
            entries[who] = ("character", demo.pick([0.0, 5.0, 5.0]), False, False, ["Traders"])
        friends = [x for x in demo.characters if x.user_id != c.user_id and x.pk == x.user.main_character_id]
        for x in demo.sample(friends, 12 if r == "star" else demo.rng.randint(1, 5)):
            entries[x.pk] = ("character", demo.pick([5.0, 10.0]) if x.alliance_id == c.alliance_id else 5.0, demo.chance(0.3), False,
                             ["Friends"] if not many or demo.chance(0.6) else ["FCs"])
        for cid, (kind, standing, watched, blocked, labels) in entries.items():
            rows.append(Contact(character=c, contact_id=cid, contact_type=kind, standing=standing, is_watched=watched,
                                is_blocked=blocked, labels=labels if r != "alt" or demo.chance(0.5) else []))
    Contact.objects.bulk_create(rows, batch_size=2000)


def _standings(demo):
    agents = research_agents()
    rows = []
    for c in demo.characters:
        home = demo.pick(EMPIRES)
        for faction in FACTIONS:
            if faction in EMPIRES:
                standing = demo.rng.uniform(2, 7.5) if faction == home else demo.rng.uniform(-2.5, 3)
            elif demo.chance(0.7):
                standing = demo.rng.uniform(-8, -0.5)
            else:
                continue
            rows.append(Standing(character=c, from_id=faction, from_type="faction", standing=standing))
        for corp in demo.sample(NPC_CORPORATIONS, demo.rng.randint(3, len(NPC_CORPORATIONS))):
            rows.append(Standing(character=c, from_id=corp, from_type="npc_corp", standing=demo.rng.uniform(-3, 8)))
        for agent in demo.sample(agents, demo.rng.randint(1, 5)):
            rows.append(Standing(character=c, from_id=agent, from_type="agent", standing=demo.rng.uniform(0.5, 9)))
    Standing.objects.bulk_create(rows, batch_size=2000)
