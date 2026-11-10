# Mumble — User guide

The Mumble plugin gives you a login for your corporation's Mumble voice server. You make the account here, then
connect with the normal Mumble client. Your name and groups in Mumble follow your main character, groups and state on
this site, and are worked out fresh every time you connect. If you have the permission, you can also hand out
temporary access links to guests.

## Where to find it

- **Mumble** in the main menu opens your Mumble page (`/p/mumble`).
- The **Mumble** dashboard widget shows a **Set up** button if you don't have an account yet, or your Mumble name and
  groups once you do.
- **Temporary access** in the menu appears if you may hand out guest links.

If the page says "Mumble isn't set up yet", your leadership hasn't connected a Mumble server to the site. If it says
"You don't have access to Mumble", your state doesn't include Mumble access; ask your leadership.

## Creating your Mumble account

1. Open **Mumble** from the menu.
2. Check the **You'll be** box. It shows the name others will see in Mumble and the Mumble groups you'll be in.
3. Click **Create my Mumble account**.
4. The dialog shows the login name you'll sign in with. Pick a password option:
   - **Make one up for me**: a random password, shown once.
   - **I'll choose one**: type your own (8 to 100 characters).
5. Click **Create account**.
6. Copy the password from the green box. It isn't shown again. Click **Done** when you have it.

Your login name is made from your main character (spaces become underscores, for example `Pilot_One`) and can't be
changed later. The name others see in Mumble (for example `[TCORP] Pilot One`) follows your current main character
each time you connect.

## Connecting with Mumble

Your Mumble page shows **Server**, **Port** and **Username**, each with a copy button.

1. Install the Mumble client if you don't have it.
2. Click **Open in Mumble**. Your Mumble client opens with the server and username filled in.
   Or add the server by hand in Mumble with the **Server**, **Port** and **Username** shown.
3. Enter your password when Mumble asks.

After your first login with the password, the server may remember your Mumble client certificate. That computer then
gets in without the password, as Mumble normally works. Your page says whether your certificate is remembered.
Setting a new password forgets it; it's remembered again the next time you log in with the password.

## Managing your account

| Button | What it does |
|---|---|
| **New password** | Sets a new password (made up for you, or your own). The old one stops working straight away. Update it in your Mumble client's server list. |
| **Forget my certificate** | Shown when a certificate is remembered. Next time Mumble asks for your password. Use it if you switched computers or want to be asked again. |
| **Delete account** | Deletes your Mumble login. You can't connect until you make a new one, and your username may be taken by then. |

**Your Mumble groups** lists the groups you get for the server's channel permissions. If it says "Changed since you
last connected", reconnect to pick them up.

## Temporary access links

If you have the permission, **Temporary access** (or the **Temporary access** button on the Mumble page) lets you
bring people without an account onto comms: diplomats, guests on a fleet, a recruit.

### Making a link

1. Click **New link**.
2. Fill in **What it's for** (shown to the guests and to you), for example "Diplo meeting Saturday".
3. Pick how long it **Lasts** (from 1 hour up to the limit your leadership set).
4. Optionally set **Uses**: how many people may use it. Empty means no limit.
5. Click **Make link**.
6. Copy the link from the green box and send it to your guests.

### Looking after your links

Each link shows its status (**Active**, **Expired**, **Used up**, **Withdrawn** or **Maker lost access**), who used it
and when they last connected.

- **Copy link** copies it again while it is active.
- **Withdraw** stops the link. Guests who are connected are disconnected within about half a minute, and none of its
  logins work any more.
- **Cut off** next to a guest does the same for just that guest.

Your links and their guests' logins also stop working if you lose the permission to hand out links or leave the site.

### What the guest sees

The guest opens the link in a browser, no account needed.

1. They enter **Your name** (at least 2 characters) and click **Get my login**.
2. The page shows the server, port, username and password, and an **Open in Mumble** button. The password isn't shown
   again.
3. In Mumble they appear as `[TEMP] <name>` (or the format your leadership chose) and get the guest group.
4. Their access ends when the link runs out. The page tells them when.

## Notifications

You get a notification in the **Mumble** category when a manager resets your password ("Your Mumble password was
reset"; ask them for the new one) or deletes your account. You can mute the category under
**Settings → Notifications**.

## FAQ and troubleshooting

**Mumble says my password is wrong.**
Check you are using the login name shown on your Mumble page, not your character name. If you lost the password,
click **New password**.

**"too many failed logins; wait a few minutes".**
After ten failed logins for one account, password logins are refused for ten minutes. If your computer's certificate is
remembered, it still gets you in.

**I can't hear or join a channel I should.**
Check **Your Mumble groups**. If a group is missing, it may not be mapped to a Mumble group, or you need to reconnect.
Ask your leadership if it is still wrong.

**My name in Mumble is wrong.**
It follows your main character at every login. Change your main, then reconnect.

**I switched computers and Mumble asks for my password.**
That's expected. Enter it once and the new computer is remembered.

**A guest says the link doesn't work.**
It may have expired, been used up or withdrawn. Make a new link. A guest can make at most a few logins from one place
in a short time.
