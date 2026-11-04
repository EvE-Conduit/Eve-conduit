# Fleets & FATs — User guide

Fleets & FATs records who flew in each fleet. Each record is a FAT (fleet attendance, also called a PAP). Your FATs
count towards group requirements, so some groups or roles may need a number of FATs. You get a FAT automatically when
the FC tracks the in-game fleet, or by opening the fleet's FAT link. This guide covers both the pilot side and the FC
side of running a fleet.

## Where to find it

- Open **Fleets** in the sidebar.
- The **Fleets** dashboard widget shows your fleets in the last 30 days, your last fleet and your all-time total.

## For pilots

### Your attendance

The **Fleets** page shows three counters: **My FATs · 30 days** (with a split by fleet type), **My FATs · 90 days**
and **My FATs · all time**. Below are two tabs:

- **Recent fleets**: every fleet with its type, FC, start time and pilot count. Search by **Fleet or FC**, or filter by
  type.
- **Fleets I flew in**: the fleets you have a FAT for, with the characters that flew.

Open a fleet to see its pilots, ships and systems. If you have a FAT, it says **You have a FAT for this fleet**.

### Get a FAT

**Tracked fleet.** If the FC tracks the in-game fleet, you don't need to do anything. Everyone in the in-game fleet
gets a FAT within a minute. The fleet MOTD may say so at the bottom, under a green `--- FATs by EvE Conduit ---` line.

**FAT link.** If the FC posts a FAT link in fleet chat:

1. Open the link while signed in.
2. Tick the characters that flew in the fleet. Your first available character is ticked already.
3. Press **Register FATs**.

On a tracked fleet, the link only accepts characters that were seen in the in-game fleet this round. Those already
have their FAT, so you don't need the link at all.

### FAT rounds

On long ops the FC can start a new FAT round, for example every hour. Each round is one more FAT. On a tracked fleet
you get it automatically. Otherwise use the FAT link again.

### How FATs count for group rules

- One FAT per fleet, or per FAT round.
- Two of your characters in the same round count once.
- FATs you added by hand for your own characters don't count.
- A group can count only some fleet types, or only fleets with a minimum number of pilots.

## For FCs: running a fleet

You need the `fleets.run_fleets` permission. You can only manage fleets you started, unless you are a fleet manager.

### Before the fleet

To track the in-game fleet, your FC character's login needs `esi-fleets.read_fleet.v1`. To write the FAT lines into
the fleet MOTD, it also needs `esi-fleets.write_fleet.v1`. If it lacks them, log in with that character again under
Characters → Add character.

### Start a fleet

1. Form the fleet in game. Your FC character must be fleet boss.
2. On the **Fleets** page, press **New fleet**.
3. Fill in:
   - **Name**, for example "Sunday CTA: Keepstar defense".
   - **Type**: CTA, Stratop, Roam, Home defense, Mining, any type your managers added, or **None**.
   - **Track the in-game fleet with**: pick your fleet boss character, or **Don't track; use the FAT link**.
   - **FATs in the fleet MOTD**: on by default when tracking.
   - **FAT link stays open**: **Until the fleet ends**, **15 minutes**, **30 minutes**, **1 hour** or **2 hours**.
   - **Notes**: doctrine, comms, staging. Pilots see them on the FAT link page.
4. Press **Start fleet**. If tracking fails, the fleet is still created and you see why.

### While the fleet runs

The fleet page has these cards:

- **In-game fleet**: shows **Tracking with** your character and when it was last read. Press **Read now** to read the
  fleet at once instead of waiting for the next minute. Press **Stop** to stop tracking. If tracking is off, pick a
  character and press **Track**.
- **FATs in the fleet MOTD**: a switch. When on, two green lines go at the bottom of the in-game MOTD, two empty lines
  below your text: that everyone in fleet gets a FAT automatically, the round, and how many pilots have one so far.
  No names are shown. Write your own MOTD text above the `--- FATs by EvE Conduit ---` line; it is kept. Switching it
  off takes the lines out.
- **FAT rounds**: press **New FAT round** to start the next round. Rounds are at least 15 minutes apart.
- **FAT link**: copy the link and paste it in fleet chat. Press **Close link**, **Open 30 min** or **Open**.
- **Pilots**: every FAT with ship, system and how it was recorded (**In-game fleet**, **FAT link** or **Added by FC**).
  Type in **Add a pilot by character name** and press **Add** to add someone. Press the bin icon to remove a FAT.

Tracking stops by itself when:

- the in-game fleet ends, or someone else becomes fleet boss;
- your character's login stops working;
- 12 hours have passed since the fleet started.

The reason is shown under **Tracking stopped**.

A FAT link with no closing time closes 12 hours after the fleet, or its latest FAT round, started.

### End the fleet

1. Press **End fleet** and confirm.
2. Tracking stops and the FAT link closes. The MOTD lines change to "Fleet ended: N pilots got a FAT".

You can still add or remove pilots afterwards.

## Notifications

There are no personal notifications. Your site may post new fleets to Discord as a form-up call.

## FAQ and troubleshooting

**"This FAT link has closed; ask the FC to add you".**
The link timed out or the fleet ended. Ask the FC to add you by hand.

**"... wasn't seen in the in-game fleet".**
The fleet is tracked and that character wasn't in it this round.

**"None of your characters has granted fleet access".**
Log in with your FC character again under Characters.

**"... has to be the fleet boss (fleet commander)".**
Make that character fleet boss in game, then press **Track**.

**"... isn't in a fleet in game right now".**
Form or join the fleet in game first.

**"FAT rounds are at least 15 minutes apart".**
Wait the number of minutes shown, then try again.

**The MOTD lines don't appear.**
Your character needs `esi-fleets.write_fleet.v1`. The FC card shows the error. FATs are still tracked.
