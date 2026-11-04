# Recruitment — User guide

The Recruitment plugin is how people apply to join, and how recruiters review them. Applicants pick a form, answer
its questions and follow their application, including messages from the recruiters. Recruiters work through a queue,
look at each applicant's characters, talk to them and accept or reject. Every member also has a Referrals page
showing who they brought in. This guide has a section for applicants, one for members (referrals) and one for
recruiters.

## Where to find it

- Sidebar: **Recruitment**, with **Referrals** nested under it. Anyone who has signed in sees these, including
  guests who just logged in with a new EVE character.
- Recruiters (`recruit.review_applications`) land on the **Applications** queue instead of the apply page, and get a
  **Recruitment** dashboard widget.

## For applicants

### Applying

1. Sign in to the site with your EVE character.
2. Open **Recruitment**. The **Join us** page lists the forms that are open. If none are, it says
   **Not recruiting right now**.
3. Click a form. Its introduction is shown at the top.
4. Answer the questions. Questions can be a short answer, a long answer, **Yes** / **No**, or a pick from a list.
   Required questions must be answered.
5. Optionally fill in **Who referred you?**: type at least three letters of the name of the member who brought you
   here, then pick them from the list. Only members' main characters are listed.
6. Click **Send application**. The recruiters are told.

Click **Back** to return to the list of forms without sending.

You can have only one application in progress at a time.

### If the form needs Discord

Some sites require you to link Discord and join their Discord server before you apply. A form card then says
**needs Discord**. When you open it, a warning says what's missing:

- **Link your Discord account first**: link it on the Discord page.
- **Join our Discord server first**: your Discord account is linked but isn't on the server. Join from the Discord
  page.

Click **Go to Discord** to get there, then **Check again** when you're done. **Send application** stays disabled until
both are done.

### Following your application

After sending, **Recruitment** shows **Your application**:

- The progress line: **Submitted**, **In review** (with the recruiter's name once someone takes it), then the
  decision.
- **Messages**: between you and the recruiters. Type a message and click **Send** (or press Ctrl+Enter).
- **Your answers**, and who referred you.

While your application is open, recruiters can see your characters and open their full character sheets.

### Withdrawing

1. Click **Withdraw application**.
2. Confirm with **Withdraw**.

The recruiters are told and the application is closed. You can apply again later.

### The decision

You get a notification either way, with the recruiter's message if they wrote one:

- Accepted: "Welcome aboard! Your application was accepted". You are added to the groups the form gives.
- Not accepted: "Your application was not accepted". You're welcome to apply again later.

For 30 days the Recruitment page also shows the decision at the top. Past applications are listed under
**Earlier applications**.

### Notifications you may get

| Notification | When |
| --- | --- |
| "A recruiter wrote to you" | A recruiter sent you a message |
| "Welcome aboard! Your application was accepted" | You were accepted. Always delivered. |
| "Your application was not accepted" | You were rejected. Always delivered. |

These are in the **Recruitment** category (**Settings** → **Notifications**).

## For members: your referrals

1. Open **Recruitment** → **Referrals** (**Your referrals**).
2. The cards show **Recruited** (pilots accepted), **Referred** (pilots who named you), **In progress** (waiting for
   a decision) and **Not accepted** (rejected or withdrawn).
3. The **Referrals** table lists each application with **Pilot**, **Form**, **Status** and **Applied**.

Someone shows up here when they name you under **Who referred you?** as they apply. They can only find you by your
main character's name.

## For recruiters (permission `recruit.review_applications`)

### The queue

1. Open **Recruitment**. The **Applications** page lists applications.
2. Pick **Open**, **Mine** (open ones you have taken), **Accepted**, **Rejected** or **Withdrawn**. Each shows a count.
3. Use **Find a pilot or form** to search by any of the applicant's character names or by form name.
4. The table shows **Applicant**, **Form**, **Status** (**New** or **In review** while open), **Recruiter** and
   **Applied**. Click a row to open it.

### Reviewing an application

The application page shows:

- the form, applicant, when they applied, who referred them and the recruiter;
- the progress line and the **Answers**;
- **Notes and messages**;
- **Characters**: every character of the applicant, with corporation and alliance, **Skill points**, **Wallet**,
  **Age**, **Security** and **Kills / losses**. **main** marks the main character, and **login expired** marks a
  character whose EVE login no longer works. Click the link next to a character to open its full character sheet.
  Characters are only shown while the application is open;
- **Accepting adds them to**: the groups the form gives;
- **Earlier applications** by the same person.

### Taking an application

Click **Take it** to make yourself the recruiter. The status becomes **In review**. If someone else has it, the button
says **Take over**.

### Notes and messages

1. Type in the box under **Notes and messages**.
2. Use the switch to choose **Internal note: only recruiters see it** or **Message: the applicant sees it**.
3. Click **Add note** or **Send**.

Messages notify the applicant. Internal notes notify nobody.

### Accepting or rejecting

1. Click **Accept** or **Reject**.
2. Optionally write **Message to them (optional)**. It is sent with the notification and shown on their application.
3. Confirm.

Accepting adds the applicant to the form's groups straight away. You can't decide your own application.

### Recruiter notifications

| Notification | Sent to |
| --- | --- |
| "New application from <name>" | Every recruiter |
| "<name> wrote on their application" | The recruiter who took it, or every recruiter if nobody has |
| "<name> withdrew their application" | The recruiter who took it |

If the Blacklist plugin is installed, people with blacklist access are also warned when an applicant's character is
blacklisted.

## FAQ and troubleshooting

**"You already have an application in progress."**
Open **Recruitment** to follow it, or withdraw it first.

**"This form isn't taking applications right now."**
The form was closed. Pick another or try later.

**"Please answer “...”".**
A required question is empty.

**"Couldn't reach Discord to check; try again in a minute".**
Discord didn't answer. Click **Check again** after a minute.

**I joined the Discord server but it still says I'm not on it.**
Wait a few seconds and click **Check again**.

**The referrer list doesn't find the member.**
Type at least three letters of their main character's name. Alts aren't searched.

**I can't write on my application any more.**
It's closed. Apply again if you want to.

**(Recruiters) The Characters card is empty.**
Characters are only shown while the application is open.
