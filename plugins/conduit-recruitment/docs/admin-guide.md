# Recruitment — Admin guide

The Recruitment plugin (plugin id `recruit`) handles applications to join: forms with questions, a review queue for
recruiters with each applicant's characters, internal notes and messages, and accepting applicants into groups. It
also tracks referrals and can require applicants to be on your Discord server. This guide covers requirements,
permissions, forms, settings and events.

## Requirements

| Requirement | Details |
| --- | --- |
| EvE Conduit | 0.5.55 or newer |
| Other plugins | Optional: [Discord](../../conduit-discord), installed, switched on and set up, for **Require Discord** and for picking roles for Discord pings. Optional: [Blacklist](../../conduit-blacklist), which checks every new application. |
| ESI scopes | None of its own. The characters panel shows data the character sheets already collect (skill points, wallet, age, security status, kills and losses). |
| Corporation roles | None |

## Install and switch on

1. Go to **Administration** → **Plugins** and open the **Browse** tab.
2. Pick **Recruitment** (category HR) and click **Install**. Leave **Switch on after installing** on, or switch it
   on later on the **Installed** tab. The site restarts for a minute or so.
3. Give the permissions below to your recruiters.
4. Create at least one form (see below). Until a form is open, applicants see **Not recruiting right now**.

The plugin is open to everyone who has signed in, not only members: guests use it to apply.

## Permissions

Give them under **Administration** → **Groups**. They are listed with the **HR staff** permissions.

| Permission | What it allows | Suggested group |
| --- | --- | --- |
| `recruit.review_applications` | See the queue, open any application, see applicants' characters and open their character sheets while the application is open, write notes and messages, take, accept and reject; get notifications; see the dashboard widget | Recruiters |
| `recruit.manage_forms` | Create, change, close and delete forms; change **Settings**; set Discord pings | Recruitment lead |
| `site.manage_access` (core) | Needed to put a group on a form unless you lead that group; always needed for a group that carries administrator permissions, and to accept an applicant into one | Administrators |
| `discord.access_discord` (Discord plugin) | "Can link a Discord account". Applicants need it to link Discord when **Require Discord** is on. Every state has it unless you took it away. | All states |

Give both recruitment permissions to the people who also set up forms.

## Forms

Open **Recruitment** and click **Forms** (needs `recruit.manage_forms`). Each form card shows **Open** or **Closed**
with a switch, the number of questions and applications, and the groups it adds.

To create or change a form:

1. Click **New form** (it starts with a few example questions you can change), or **Edit** on a form.
2. Fill in the fields below.
3. Click **Save form**.

| Field | Default | What it does |
| --- | --- | --- |
| **Name** | — (required) | Shown to applicants, e.g. one form per corporation. |
| **Taking applications** | On | Off closes the form: it's hidden from applicants and can't be sent. |
| **Introduction** | empty | Shown above the questions: who you are, what you expect, what happens next. |
| **When accepted, add them to** | none | Groups an accepted applicant is added to. |
| **Questions** | example questions | Up to 50. Each has a label, an answer type, a **Hint (optional)** and a **Required** switch. Reorder with the arrows. |

Answer types:

| Type | Notes |
| --- | --- |
| **Short answer** | Up to 300 characters |
| **Long answer** | Up to 10,000 characters |
| **Yes / no** | |
| **Pick one** | Enter choices one per line; at least 2, up to 20 |

A form can be deleted only while nobody has applied with it. Otherwise close it.

Groups that carry administrator permissions can only be put on a form, and applicants only accepted into them, by
someone with `site.manage_access`. Otherwise a recruiter could make their own alt an administrator.

## Settings

Open **Recruitment** → **Settings** (needs `recruit.manage_forms`).

| Setting | Default | What it does |
| --- | --- | --- |
| **Require Discord** | Off | Applicants must link their Discord account and be on your Discord server before they can send an application. Saves as soon as you switch it. |

**Require Discord** needs the Discord plugin installed, switched on and set up. You can't switch it on while the
Discord plugin isn't installed. While the plugin is off or not set up, nothing is checked and the page shows a
warning. The apply page asks Discord on load (cached for 5 minutes once someone is on the server, 20 seconds if not)
and asks again, live, when the application is sent.

The **Discord pings** section is also on this page.

## Day-to-day operation

Recruiters work from the **Applications** queue. See the [user guide](user-guide.md) for the steps. In short:

1. A new application arrives as **New** and every recruiter is notified.
2. A recruiter clicks **Take it**; the status becomes **In review**.
3. Recruiters talk to the applicant with messages, and to each other with internal notes.
4. A recruiter clicks **Accept** or **Reject**, with an optional message. Accepting adds the applicant to the form's
   groups, as far as each group's own rules allow (see below).

A form's groups follow the same rules as adding a member under **Administration** → **Groups**:

- Only someone with `site.manage_access`, or a leader of the group, can put a group on a form. Groups already on a
  form stay when a form manager changes something else.
- A smart group can't be put on a form: its rules decide who is in it.
- When a group only allows some states and the applicant isn't in one yet (a guest accepted into a members-only
  group), the application is accepted but they are not added to that group. The recruiter is told, and an internal
  note on the application says which groups were left out. Add them under **Groups** once their state allows it,
  or use a group without a state limit on the form.

An applicant can have one open application at a time. After withdrawing or being rejected they can apply again an
hour later, and they can write up to 5 messages on their application in 10 minutes: every application and message
notifies recruiters, and anyone with an EVE account can apply. Nobody can decide
their own application.

The **Recruitment** dashboard widget shows open applications, how many are with you, and how many are new.

## Referrals

Applicants can name the member who referred them. The search:

- only matches members' main character names (never alts), and lists up to 10;
- needs at least three letters;
- only answers while at least one form is open and the person has no application in progress.

Recruiters see the referrer on the application. Every user has a **Referrals** page with their own stats.

## Webhook events and Discord pings

| Event | Label | Private | Can ping Discord |
| --- | --- | --- | --- |
| `recruit.application_submitted` | Application submitted | No | Yes |
| `recruit.application_decided` | Application decided | No | No |

`recruit.application_submitted` carries the applicant (`user`, `user_id`), the form, the application id and a link.
`recruit.application_decided` also carries `accepted`, who decided (`by`), the groups they were added to and the
`referrer_id`. Send them under **Administration** → **Integrations**.

To make new applications ping on Discord:

1. Under **Administration** → **Integrations**, add a Discord webhook that gets `recruit.application_submitted`.
2. Open **Recruitment** → **Settings**. The **Discord pings** section only appears once an enabled Discord webhook
   exists, and needs `recruit.manage_forms` or `site.manage_api`.
3. Switch on **Application submitted**.
4. With the Discord plugin linked, pick roles to ping. Otherwise give the webhook a mention under **Administration**
   → **Integrations**.

## Notifications

Category: **Recruitment**. Decisions are delivered to the applicant even if they muted the category.

| Notification | Sent to |
| --- | --- |
| "New application from <name>" | Every recruiter except the applicant |
| "<name> wrote on their application" | The recruiter who took it, or every recruiter |
| "<name> withdrew their application" | The recruiter who took it |
| "A recruiter wrote to you" | The applicant |
| "Welcome aboard! Your application was accepted" / "Your application was not accepted" | The applicant |

## Privacy and audit logging

- Applicants see their own application and messages, never internal notes.
- Recruiters see the applicant's characters, and can open their character sheets, only while the application is open.
  Each sheet view is recorded in **Administration** → **Logs** → **Snooper**.
- The referrer search never matches alts, so applicants can't learn who owns which alt.

Recorded in the audit log (**Administration** → **Logs** → **Audit**):

| Action | Audit entry |
| --- | --- |
| Someone applies | `recruit.applied` |
| Application accepted (with the groups added) | `recruit.accepted` |
| Application rejected | `recruit.rejected` |
| Form saved | `recruit.form_saved` |
| **Require Discord** switched on or off | `recruit.settings_saved` |

Taking an application, messages, notes and withdrawals are kept on the application itself, not in the audit log.

## Background jobs

None.

## Troubleshooting

**"<group> grants administrator permissions, so only an administrator can use it here".**
The form's group carries administrator permissions. Someone with `site.manage_access` must save the form or accept
the applicant, or use a different group.

**"Only someone who manages access, or a leader of <group>, can put that group on a form".**
Ask an administrator to add the group to the form, or to make you a leader of the group.

**"Not added to <group> (their state isn't allowed in this group)".**
The group only allows some states and the applicant isn't in one of them yet. They were accepted; add them to the
group once they've joined.

**"Couldn't add them to <group>: ...".**
Adding the applicant to that group failed, and the decision was not saved. Check the group under **Administration** →
**Groups**.

**"People have applied with this form; close it instead of deleting it".**
Switch the form to **Closed** instead.

**"Install the Discord plugin first: Administration → Plugins".**
**Require Discord** can't be switched on without the Discord plugin installed.

**Settings shows "Not being checked".**
The Discord plugin is switched off or isn't set up. Finish its setup on the Discord page.

**Applicants can't link Discord.**
They need `discord.access_discord` ("Can link a Discord account") through their state.

**There's no Discord pings section.**
Add an enabled Discord webhook under **Administration** → **Integrations**.
