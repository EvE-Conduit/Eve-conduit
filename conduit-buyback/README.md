# Buyback

Buyback programs: members paste their items for an instant quote, contract them to you with the tracking number as
the description, and every contract is checked against its quote before you accept it.

- **Getting a quote** (everyone a program is open to): paste from the inventory (list or detail view), contracts,
  the mining ledger, or type `Tritanium x 1000`. Each item shows how it was valued, the tax and what it pays;
  items the program doesn't buy say why. The quote comes with the steps to make the contract: who to, where, the
  price and the tracking number, each with a copy button. **My quotes** follows every quote and its contract, and
  sellers are told when a contract is accepted or rejected.
- **Pricing** (per program): hub buy, sell or split price less a tax. On top: extra tax (or less) per item, fixed
  prices, items not bought, or only listed items; a hauling cost per m³; an extra tax for items worth little per m³
  (T1 ships, bulky junk); assembled items refused or taken. Ore, moon ore and ice are valued at the best of raw,
  compressed and refined (at your refining rate), optionally with their compressed volume. Tech I modules can be
  valued at what they reprocess into, and Sleeper and Triglavian loot at the NPC buy price. Item rules can be set
  for a whole market group (Minerals, Standard Ores, Salvaged Materials...).
- **Manual review list**: items or item groups (officer modules, rare loot) flagged on the quote, so the seller
  knows, and on the contract, so the manager checks them by hand.
- **Contract checks**: every 15 minutes each program owner's contracts are read (character, and corporation for
  programs that go to the corporation). Contracts carrying a tracking number or the program's prefix are matched to
  their quote and checked: missing or extra items, items asked for in return, a higher (or lower) price, the wrong
  location, made out to the wrong character or corporation, extra text in the title, a tracking number used twice,
  watched items, and prefixes without a quote behind them (imitations). Managers are notified of new contracts,
  with a warning when something's wrong.
- **Running programs** (permission `buyback.manage_programs`): create programs owned by one of your characters (its
  login reads the contracts), pick locations, managers, states and groups, and see each program's open contracts
  with their checks, what was bought per month, top sellers, the most bought items and the corporation wallet
  division's balance. **Check now** reads the contracts straight away.
- **Locations**: a name, a solar system and optionally the station or structure id, which makes contracts made
  anywhere else stand out. Known stations and structures can be picked by name.
- **Public programs**: a program marked public gives quotes to anyone at `/public/p/buyback/<id>`, without an
  account (30 quotes per visitor per 10 minutes). Public quotes belong to nobody; contracts for them are checked like
  any other.
- **Prices** (permission `buyback.manage_all_programs`, which also runs every program) at the trade hub you pick:
  Jita 4-4, Amarr VIII, Dodixie IX-20, Rens VI-8 or Hek VIII-12 in one click, or any region, system, station or
  (with ESI) player structure. The top-5% average or the best order, from:
  - **ESI** (the default), straight from CCP: the hub's whole order book is read every 30 minutes (Jita: about 400
    pages, 30 seconds) and quotes use what was read; the first read starts as soon as the plugin is used. Also reads
    a **player structure's market**, with a character that can dock there (`esi-markets.structure_markets.v1`).
    PLEX trades on CCP's global PLEX market, which ESI's regional orders don't include.
  - [Fuzzwork](https://market.fuzzwork.co.uk/api/): any station, system or region; free; fetched when a quote needs
    them.
  - [Janice](https://janice.e-351.com/): Jita 4-4; needs an API key.
- **Manipulation guard** (on by default, any source): each market price, including the minerals refined values use,
  is compared with what the item traded for over the last 7 days in the hub's region (ESI market history). A price
  more than 20 % above that average is suspect: if the item traded on at least 5 of those days, the average is used;
  if it rarely trades, the lower of the two is used and the item goes to manual review. Sellers see a badge saying
  which. Prices far *below* the average can be caught too (off by default: buy prices normally sit below the
  average, and a low price only costs the seller). All four numbers are settings.
- **Settings** also cover the tracking prefix, how long quotes without a contract are kept, all-or-nothing quotes,
  and whether only the seller and managers can open a quote.

Other permissions: `buyback.view_all_statistics` sees every program's contracts and statistics;
`buyback.view_leaderboard` sees the top sellers of the programs a member can use. Give them to a state
(Administration → States) or a group (Administration → Groups).

Reprocessing and compression come from the static data, so this needs EvE Conduit 0.5.33 or newer. Contracts are
read with `esi-contracts.read_character_contracts.v1` and `esi-contracts.read_corporation_contracts.v1`.

Events for webhooks: `buyback.contract_created`, `buyback.contract_finished` (a contract was accepted, rejected,
deleted or expired). Post them to a Discord channel with a webhook (Administration → Integrations).

Inspired by [allianceauth-buyback-program](https://gitlab.com/paulipa/allianceauth-buyback-program).
