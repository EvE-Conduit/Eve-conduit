# Mentoring — User guide

The Mentoring plugin pairs new members with an experienced member who shows them the ropes. You ask for a mentor,
a mentor takes you on, and the two of you work through a list of goals, talk in a private thread and, at the end, the
mentor graduates you. This guide covers asking for a mentor and following your mentorship, and then what mentors do.

## Where to find it

- Sidebar: **Mentoring**.
- Dashboard: the **Mentoring** widget. It shows your mentor and goal progress, or (for mentors) your mentees and how
  many are waiting. If your site has marked you as new, it invites you with **Ask for a mentor**.

## For new members

### Asking for a mentor

1. Open **Mentoring**. The **Get a mentor** card is shown while you have no mentorship open.
2. Under **What would you like help with?**, pick one or more focus areas (for example PvP, Industry or Mining).
3. Fill in **When do you usually play?**, e.g. "EU evenings".
4. Optionally write **Anything else? (optional)**.
5. Under **Mentor**, pick **Anyone** (the first mentor free takes you on) or a specific mentor. Only mentors who are
   taking new mentees and have free places are listed. If none are, ask anyway; a mentor will pick you up.
6. Click **Ask for a mentor**.

If you picked a mentor, only they are told. If you picked **Anyone**, every active mentor is told. Your focus areas
decide which goals you get later.

### While you wait

- **Your mentorship** shows **Waiting for a mentor**, who you asked for and when.
- Click **Open** to see the mentorship page. You can already write there; program managers get your messages until
  a mentor takes you on.
- To cancel, open the mentorship page and click **Withdraw**. You can only withdraw while you're still waiting.
  After withdrawing you can ask again an hour later. While you wait for a mentor you can write up to 5 messages in
  10 minutes; they go to the program managers.

### Your mentorship

Once a mentor takes you on, you get a notification "<mentor> is your mentor". Open **Mentoring** and click **Open**.
The page shows:

- **Goals**: your checklist and progress. Goals marked **ticks itself** tick automatically once you meet them (for
  example skill points or flying in a fleet). Goals marked **you can tick it** can be ticked by you. Your mentor
  ticks the rest.
- **Messages**: your thread with your mentor. Type your message and click **Send** (or press Ctrl+Enter).
- **Mentor**: who your mentor is, when they play and what they can help with.
- **What they asked for**: your focus areas, play time and note.

Your mentor can open your character sheets while the mentorship is active, if your site allows it. Each look is
recorded in the site's snooper log.

### When it ends

- **Graduated**: your mentor graduates you. You get "Congratulations, you graduated!", with their message.
- **Ended**: your mentor or a program manager ends it with a reason. You're told the reason.

Afterwards the mentorship is listed under **Your earlier mentorships**, and you can ask for a mentor again.

### Notifications you may get

| Notification | When |
| --- | --- |
| "<mentor> is your mentor" | A mentor took you on, or you were handed to another mentor |
| "<name> wrote to you" | Your mentor or a program manager wrote in your thread |
| "Congratulations, you graduated!" | You graduated. Always delivered. |
| "Your mentorship ended" | It was ended, with the reason |
| "Your mentorship is open again" | A program manager reopened it |

All are in the **Mentoring** category (**Settings** → **Notifications**).

## For mentors (permission `mentors.mentor`)

### Your mentor profile

The **Your mentor profile** card on the Mentoring page is what new members see when they pick a mentor.

1. Fill in **About you** (what you fly and what you can teach), **When you play** and **Mentees at most**
   (1 to 50, default 3).
2. Under **You can help with**, pick your focus areas.
3. Click **Save profile**.

The switch at the top of the card shows **Taking new mentees** or **Paused**. Paused mentors keep their mentees but
take no new ones, aren't listed to new members, and aren't notified about open requests.

### Taking someone on

1. Look at **Waiting for a mentor** on the Mentoring page. People who asked for you come first (**asked for you**),
   then those whose focus matches yours, then the longest waiting.
2. Switch on **Matching my focus** to hide requests that don't match your focus areas (only shown once you have
   picked some).
3. Click a request to read what they asked for. You see their main character only.
4. Click **Take them on**.

You can't take someone on while your profile is paused or you're at your **Mentees at most** limit. Someone who
asked for another mentor by name is theirs to take: there is no **Take them on** button for you unless that mentor
has paused or stopped mentoring. A program manager can assign them to you.

### Working with a mentee

**Your mentees** lists your active mentees with goal progress. Open one to:

- tick goals that don't tick themselves (and untick them). You can also mark a goal with rules as done before its
  rules pass;
- write in the thread. The switch next to the box picks **Message: everyone in the mentorship sees it** or
  **Private note: the mentee doesn't see it**. Private notes are only for mentors and program managers;
- see their characters with corporation and skill points. With sheet access on, open a character's full sheet from
  the link next to it.

When every goal is done, the page shows **Every goal is done** with a **Graduate** button.

### Graduating or ending

1. Click **Graduate** (or **End**).
2. For graduating, add **A message to them (optional)**. For ending, fill in **Why does it end?**; a reason is
   required.
3. Confirm.

### Mentor notifications

| Notification | When |
| --- | --- |
| "<name> asked you to be their mentor" | Someone asked for you by name |
| "<name> is looking for a mentor" | Someone asked for anyone (sent to every active mentor) |
| "<name> wrote to you" | Your mentee wrote in the thread |
| "You're now mentoring <name>" | A program manager assigned someone to you |
| "<name> has a new mentor" | A program manager handed your mentee to someone else |

Ctrl+K search finds your mentees by name. Mentees on the waiting list are found by their main character's name.

## FAQ and troubleshooting

**"You already have a mentor or are waiting for one."**
You can have only one open mentorship. Open it from the Mentoring page.

**"That mentor isn't taking new mentees right now."**
They paused or filled up since you opened the page. Pick someone else or **Anyone**.

**I can't tick a goal.**
Goals that tick themselves update on their own. Others are ticked by your mentor unless marked **you can tick it**.
Goals can only be ticked while the mentorship is active.

**"Your mentor profile is paused; switch it on to take mentees."**
Switch your profile back to **Taking new mentees**.

**"You already have N mentees, your limit."**
Raise **Mentees at most**, or ask a program manager to assign the mentee to you.

**"Someone already took this request."**
Another mentor took them on first.
