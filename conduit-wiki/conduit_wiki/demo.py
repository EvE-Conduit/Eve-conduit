"""Example data for demo mode (Plugin.demo_data): a small wiki with a home page, a new member guide, doctrine notes
and staging info, each with a bit of history."""

from datetime import timedelta

from .models import Page, Revision


def _pages(demo):
    alliance = demo.alliance.name if demo.alliance else "the alliance"
    ticker = demo.alliance.ticker if demo.alliance else "ALLY"
    staging = next((s["name"] for s in demo.structures if "Staging" in s["name"]), "Rens - Starfall Staging")
    market = next((s["name"] for s in demo.structures if "Market" in s["name"]), "Perimeter - Keepstar Market")
    forge = next((s["name"] for s in demo.structures if "Forge" in s["name"]), "Perimeter - Aurora Forge")
    # slug, title, parent slug, body, extra fields
    return [
        ("home", f"Welcome to {ticker}", None, f"""# Welcome to {alliance}

This wiki holds everything you need to find your feet: how we fly, where we live and who to ask.

## Start here

- [[New Member Guide]]: your first week, step by step
- [[Doctrines]]: what to fit and train for fleets
- [[Staging]]: where we live and how to move your stuff there
- [[Fleet Etiquette]]: comms discipline and what the FC expects

> Can't find something? Ask in the alliance channel or ping a recruiter. If you work it out, write it down here.
""", {}),
        ("new-member-guide", "New Member Guide", None, f"""# New Member Guide

Welcome aboard. Work through this list in your first week and you'll be ready for fleets.

## Day one

1. Add **all** your characters on the Characters page, alts included. Recruiters check every one.
2. Join voice: open Services and create your account. Use the name the site gives you, not a nickname.
3. Read [[Fleet Etiquette]] before your first op.
4. Set your home station to **{staging}** with a medical clone.

## Your first week

| Task | Why |
| --- | --- |
| Move a few doctrine ships to staging | Fleets form fast, there's no time to buy one |
| Train the skills in the *Mainline Doctrine* skill plan | So you can fly something useful |
| Join a group or two (Industrialists, Logistics Wing) | That's where the pings go |
| Say hello on comms | We don't bite |

## Getting ISK

- Mining fleets run most evenings from the {forge}. Bring a Procurer and you'll get boosts from an Orca.
- SRP covers doctrine ships lost on alliance fleets. File it on the SRP page with the killmail link.

## Who to ask

Recruiters and directors are listed on the Groups page. For anything about the site itself, ask a director.
""", {}),
        ("doctrines", "Doctrines", None, """# Doctrines

What we fly, in order of how often you'll see it pinged. The FC links the fits in the fleet MOTD; this is the *why*.

- [[Mainline: Ferox Fleet]]: our bread and butter
- [[Logistics Wing]]: Basilisks and Guardians
- [[Capital Escalation]]: when the FC says "drop"

**Rule of thumb:** if a fleet ping names a doctrine you can't fly, bring a tackle frigate. There's always room for tackle.
""", {}),
        ("mainline-ferox-fleet", "Mainline: Ferox Fleet", "doctrines", """# Mainline: Ferox Fleet

Shield battlecruisers with long-range rails. Cheap, easy to train, forgiving.

## Skills that matter

- Caldari Battlecruiser IV
- Medium Hybrid Turret IV, Large Hybrid Turret not needed
- Shield Operation IV, Shield Upgrades IV

## On grid

- Anchor on the FC, keep at range when told.
- Broadcast for reps **once**, then wait. Don't spam.
- Primary is called by name; broadcast targets are a hint, not an order.

```
Warp-in call: "Fleet warp to FC at 30"
Primary call: "Primary <name>, primary <name>"
Align call:   "Align to <celestial>, don't warp"
```

SRP pays the hull and fitting at the Jita sell price.
""", {}),
        ("logistics-wing", "Logistics Wing", "doctrines", """# Logistics Wing

Logi pilots keep the fleet alive. You get priority SRP and a lot of thanks.

- **Basilisk** for shield doctrines, **Guardian** for armor.
- Join the Logistics Wing group so you get the logi pings.
- Lock your fellow logi first. A logi chain that holds wins fights.

> Logi doesn't broadcast. Watch the broadcast window and the watchlist.
""", {}),
        ("capital-escalation", "Capital Escalation", "doctrines", """# Capital Escalation

Carriers and dreadnoughts for structure timers and escalations. Only pilots in the **Capital Pilots** group are pinged.

1. Keep your capital in staging with fuel for two jumps.
2. Cyno alts: be in the system the FC names, fit ready, with Liquid Ozone in the hold.
3. Never light a cyno without the FC's call.

The Timers page lists the structure timers we form for.
""", {"groups": ["Capital Pilots"]}),
        ("staging", "Staging", None, f"""# Staging

| What | Where |
| --- | --- |
| Main staging | {staging} |
| Market | {market} |
| Industry | {forge} |

## Moving in

Contract your stuff to the alliance freight service (courier contract to the staging structure, collateral at Jita sell).
Expect a couple of days. Don't autopilot a freighter, ever.

## Docking rights

Every member state can dock and use the market. Blue pilots can dock but can't use the clone bay.
""", {}),
        ("fleet-etiquette", "Fleet Etiquette", None, """# Fleet Etiquette

1. **Comms discipline.** When the FC says "check, check", stop talking. Only the FC, logi anchor and scouts talk in a fight.
2. **X up in fleet chat**, not on comms.
3. **Don't warp off on your own.** If you're tackled and out of reps, say so once.
4. **Losses happen.** File SRP and get back in a ship. Nobody is angry about a loss on fleet.

The FC's call wins every argument. Talk about it in the debrief, not during the fight.
""", {}),
        ("director-notes", "Director Notes", None, """# Director Notes

Only directors can read this page.

- Review open applications every Sunday.
- SRP payouts go out on the 1st and 15th.
- Structure fuel: check the Structures page, top up anything below 14 days.
""", {"groups": ["Directors"], "locked": True}),
        ("joining-us", f"Joining {ticker}", None, f"""# Joining {alliance}

We're a friendly alliance with an industrial heart and a fleet that shows up. New pilots welcome.

- Sign in with EVE Online on this site and open **Apply**.
- A recruiter will talk to you on voice, usually within a couple of days.
- We ask to see all your characters; that's normal.

See you in space.
""", {"public": True}),
    ]


EDITS = ("Fixed typos", "Updated for the new staging", "Added a table", "Clarified the SRP rules", "Reworded the intro")


def seed(demo):
    rows = _pages(demo)
    editors = demo.sample(demo.users[:12], 5)
    authors = [demo.admin, *editors]
    pages, order = {}, {}
    for depth in (0, 1):  # parents first, so the children can point at them
        batch = []
        for slug, title, parent, body, extra in rows:
            if (parent is not None) != bool(depth):
                continue
            order[parent] = order.get(parent, 0) + 1
            batch.append(Page(title=title, slug=slug, parent=pages.get(parent), order=order[parent], body=body.strip(),
                              public=extra.get("public", False), locked=extra.get("locked", False),
                              created_by=demo.pick(authors), updated_by=demo.pick(authors)))
        for p in Page.objects.bulk_create(batch):
            pages[p.slug] = p

    revisions, stamps = [], {}
    for slug, title, parent, body, extra in rows:
        p = pages[slug]
        for name in extra.get("groups", ()):
            if name in demo.groups:
                p.groups.add(demo.groups[name])
        created = demo.ago(days=demo.rng.uniform(60, 200))
        edits = demo.rng.randint(0, 3)
        times = sorted(created + timedelta(days=demo.rng.uniform(1, (demo.now - created).days - 1)) for _ in range(edits))
        # Older revisions: the body before the last paragraph was added.
        earlier = body.strip().rsplit("\n\n", 1)[0]
        revisions.append(Revision(page=p, number=1, title=title, body=earlier if edits else p.body, note="", author=p.created_by))
        for n, _ in enumerate(times, start=2):
            revisions.append(Revision(page=p, number=n, title=title, body=p.body if n == edits + 1 else earlier,
                                      note=demo.pick(EDITS), author=p.updated_by if n == edits + 1 else demo.pick(authors)))
        stamps[p.pk] = [created, *times]
    made = Revision.objects.bulk_create(revisions)

    # auto_now(_add) stamped everything with today; put the history back in time.
    for p in pages.values():
        Page.objects.filter(pk=p.pk).update(created_at=stamps[p.pk][0], updated_at=stamps[p.pk][-1])
    for r in made:
        Revision.objects.filter(pk=r.pk).update(created_at=stamps[r.page_id][r.number - 1])
