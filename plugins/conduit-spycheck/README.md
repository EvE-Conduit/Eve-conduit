# Spy Check

A daily look through every member character's synced data for dealings with characters, corporations and alliances
you don't trust, so nobody has to search Member Audit by hand for each one.

- **What is watched:** the plugin's own **watch list** (Spy Check → Watch list), plus every active entry of the
  [Blacklist](../conduit-blacklist) plugin when that is installed and on (switch it off, or leave out "watch" entries,
  under Settings). Spy Check works without the Blacklist plugin. Each entity is matched by its own id, like Member
  Audit's counterparty search: a corporation's members' personal dealings don't count against the corporation.
- **What is looked at**, from the data Conduit already syncs (nothing extra is asked of ESI), each switchable under
  Settings:
  - **Wallet journal:** lines with them on either side (ISK moved either way).
  - **Market:** transactions with them as the other party.
  - **Contracts:** contracts they (or their corporation) issued, were assigned or accepted.
  - **Mail:** mail from them, or to them as a character, corporation or alliance.
  - **Contacts:** a contact for them with good standing (above 0 by default).
  - **Corporation history:** the character is or was in a watched corporation, or in a corporation that is in a
    watched alliance today (alliance history isn't synced).
  A member's own alts don't count, and guests are never scanned.
- **Findings:** one row per character, entity and kind, with how many records, the ISK in them, and when the first
  and last one was. Each is **new**, **acknowledged** or **dismissed** (with a note, who and when). A re-scan keeps the
  numbers up to date, and a dismissed finding stays dismissed unless newer evidence turns up than what was there
  when it was dismissed (a later journal line, mail, contract, trade or stint; for contacts, which have no date, the
  contact coming back after it was gone or its standing going up). Acknowledged findings stay acknowledged and say
  when there's been more since. Filter by state and kind, search a member, character or entity.
- **Evidence:** each finding opens the records behind it (mail shows who and the subject, not the text) with a link
  to that tab of the character sheet. Opening evidence goes in the **snooper log** like opening that tab of their
  sheet, and in the audit log; so does a member's page (as their intel).
- **Members:** everyone with findings, and a page per member with every finding across all their characters.
- **The daily scan** (06:40), or **Scan now**, updates everything and sends **one notification** naming who has new
  findings (and with whom) to the chosen group's members who may see Spy Check, or to everyone who may when no group
  is chosen. Only one scan runs at a time: Scan now while one is running says so, and the daily scan is skipped
  when Scan now is already running. It also emits `spycheck.findings`, which names members, so it only goes to webhooks that pick it by name.
  New findings can ping on Discord: switch it on under Discord pings in the Settings tab. It needs a Discord webhook
  under Administration → Integrations; with the Discord plugin linked you also pick roles.
- **Dashboard widget** with the number of new findings.

**Permissions:** `spycheck.view_findings` sees the findings and their evidence and reviews them;
`spycheck.manage_spycheck` also changes the watch list and settings and starts a scan. Members never see any of it.
Like Member Audit, a reviewer only sees findings (and hears about new ones) for the characters their character sheet
permissions reach: all, their alliance's or their corporation's. Nobody sees, hears about or reviews findings on
their own characters, and a member's page is only there for someone who may see at least one of their characters.
Give them to your HR or counter-intelligence group under Administration → Groups. Needs EvE Conduit 0.5.55 or newer.
