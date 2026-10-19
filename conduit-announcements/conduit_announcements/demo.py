"""Example announcements for demo mode (see conduit.demo.seed): a few months of news from leadership, one pinned,
some for chosen states or groups, one scheduled and one that has ended."""

from datetime import timedelta

from .models import Announcement, AnnouncementRead

# title, body, tone, pinned, days ago (negative: scheduled), days it ran for (None: still running), audience
POSTS = (
    ("Welcome to the Northern Lights Coalition",
     "Good to have you with us. A few things to get you started:\n\n"
     "- Add **all** your characters, so your corporation can see you're ready for fleets.\n"
     "- Join the groups you fly with under *Groups*: Industrialists and Logistics Wing are open to everyone.\n"
     "- Fleet pings go out in Fleets and on Discord. Turn on notifications so you don't miss them.\n\n"
     "Questions? Ask anyone in the Recruiters group.", "info", True, 120, None, None),
    ("Move op to Rens: Saturday 18:00 EVE",
     "We're moving the staging to **Rens - Starfall Staging**. Bring your doctrine ships and anything you want to "
     "keep close. Freighter pilots: the Deep Void Logistics service is free for the weekend.\n\n"
     "Form-up in Perimeter at 17:30.", "important", False, 2, None, None),
    ("Keepstar market restocked",
     "The Northern Lights Keepstar market has all the doctrine hulls and fittings again. Prices are Jita plus 5%, as "
     "always. Missing something? Post it in the buyback channel.", "info", False, 6, None, None),
    ("Hostile gang roaming Hek",
     "A gang of about fifteen has been camping the Hek gate since this morning. Haulers: route around it or wait "
     "for the all-clear. **Do not** undock the Orca.", "urgent", False, 0.3, 1, None),
    ("New mining schedule",
     "Moon fracking at the Deep Void Refinery is now every **Tuesday and Friday**. The Orca boosts from 19:00. "
     "Mining ledgers count towards the monthly leaderboard.", "info", False, 11, None, "Industrialists"),
    ("FC meeting notes",
     "Thanks to everyone who came. In short:\n\n"
     "1. Sunday roams continue, rotating FCs.\n"
     "2. New FCs shadow two fleets before leading one.\n"
     "3. The Machariel doctrine is retired; the Tempest fleet replaces it.\n\n"
     "> Lead from the front, but check your overview first.", "info", False, 9, None, "Fleet Commanders"),
    ("Tax change next month",
     "Corporation tax goes from 8% to **6%** on the first of the month, for every corporation in the alliance. "
     "Thank you for keeping the wallets healthy.", "important", False, -4, None, "member"),
    ("Holiday fleet weekend",
     "Double SRP all weekend and a prize for the best killmail. See you out there!", "info", False, 45, 3, None),
    ("Directors: quarterly review",
     "Quarterly numbers are in the director channel. Please read them before Thursday's meeting.", "important", False,
     18, None, "Directors"),
)


def seed(demo):
    directors = list(demo.groups["Directors"].user_set.all())
    rows = []
    audiences = []
    for title, body, tone, pinned, days_ago, ran_for, audience in POSTS:
        publish_at = demo.ago(days=days_ago) if days_ago >= 0 else demo.ahead(days=-days_ago)
        published = days_ago >= 0
        rows.append(Announcement(
            title=title, body=body, tone=tone, pinned=pinned, on_landing=audience is None, notify=True,
            publish_at=publish_at, expires_at=publish_at + timedelta(days=ran_for) if ran_for else None,
            announced_at=publish_at if published else None, author=demo.pick(directors) if directors else demo.admin,
            edited_by=demo.admin if demo.chance(0.2) else None,
        ))
        audiences.append(audience)
    rows = Announcement.objects.bulk_create(rows)

    for a, audience in zip(rows, audiences):
        if audience in demo.states:
            a.states.add(demo.states[audience])
        elif audience:
            a.groups.add(demo.groups[audience])

    # Most people have read the older ones; the demo account still has the latest couple to catch up on.
    reads = []
    for a, (*_, days_ago, _ran, _aud) in zip(rows, POSTS):
        if days_ago < 0:
            continue
        for user in demo.users:
            if user is demo.admin and days_ago < 3:
                continue
            if demo.chance(0.9 if days_ago > 7 else 0.5):
                reads.append(AnnouncementRead(announcement=a, user=user))
    AnnouncementRead.objects.bulk_create(reads)
