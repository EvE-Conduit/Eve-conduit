# TeamSpeak — User guide

The TeamSpeak plugin connects your TeamSpeak identity to your account on the site. You link it once with a one-time
privilege key. After that, your server groups on TeamSpeak follow your groups and state on the site. You do not need
a TeamSpeak password, and the site does not match you by nickname.

## Where to find it

- **TeamSpeak** in the site menu opens the TeamSpeak page (`/p/teamspeak`).
- The **TeamSpeak** dashboard widget shows whether you are linked. Before you link, it shows a **Link** button (or
  **Finish** if you started linking). Once linked, it shows your nickname, your server groups and a **Linked** or
  **Problem** badge.

You need the `teamspeak.access_teamspeak` permission. Every members' state has it by default. Guests do not.

## Link your TeamSpeak identity

Before you start, install the TeamSpeak client and open it on the computer you want to use.

1. Open the **TeamSpeak** page.
2. Check the **You'll be** box. It shows the nickname you will get and the server groups that come with your groups.
3. Press **Link my TeamSpeak**. The page shows your privilege key and the server address.
4. Use the key in one of two ways:
   - Press **Connect and use key**. TeamSpeak opens, connects to the server with the right nickname and uses the key
     for you.
   - Or, if you are already connected, copy the key and paste it in the TeamSpeak client under
     **Permissions → Use Privilege Key**.
5. Wait on the page. It checks every few seconds and shows "Linked! Your groups are set." when it finds your identity.
   The server also pokes you with a welcome message.

The page watches for about three minutes. After that it shows "Stopped watching; check when you're done." Press
**I've used the key** to check again.

Other buttons while linking:

| Button | What it does |
| --- | --- |
| **I've used the key** | Checks now whether the key was used. |
| **New key** | Makes a new key. The old one stops working. |
| **Give up for now** | Cancels the link and deletes the key. You can start again later. |

The key works once, for you only. A link you do not finish is cancelled after about 24 hours.

## After linking

The TeamSpeak page shows:

- your TeamSpeak nickname and a **Linked** badge;
- when you linked, when you last connected and when your groups were last checked;
- your identity (the TeamSpeak unique id);
- the server address, with copy buttons and an **Open in TeamSpeak** button;
- **Your server groups**: the linked members' group plus the server groups that come with your groups and state.

If your groups changed since the last check, the page says "Changed since the last check; press Fix my groups."

### Fix my groups

Press **Fix my groups** to bring your server groups up to date now. You can press it once every 30 seconds.

Your groups are also updated without you doing anything:

- when you join or leave a group, change state, or change your main character;
- every six hours for everyone.

Server groups that an admin gave you by hand on the TeamSpeak server are left alone.

### Unlink

1. Press **Unlink**.
2. Confirm in **Unlink your TeamSpeak identity?**.

Your server groups from the site are taken away. You can link again at any time with a new key.

### Using another computer

Your identity is the one TeamSpeak made on the computer you linked from. To use another computer, export the identity
from TeamSpeak's identity settings and import it there. Or unlink and link again from the new computer.

## Notifications

You get a notification "Your TeamSpeak identity was unlinked" when an administrator unlinks your identity. It is in
the **TeamSpeak** notification category.

## FAQ and troubleshooting

**The page says "TeamSpeak isn't set up yet".**
Your leadership has not connected a TeamSpeak server to the site yet.

**The page says "You don't have access to TeamSpeak".**
Access comes with your membership (your state). Ask your corporation's leadership if you think you should have it.

**I used the key but the page did not notice.**
Press **I've used the key**. Make sure you used the key on the right server. If the key is lost or did not work,
press **New key** and try again.

**"That TeamSpeak identity is already linked to another member."**
One TeamSpeak identity can only be linked to one account. Unlink it from the other account first, or use a
different identity.

**A red "Your groups couldn't be set" box shows on the page.**
The site could not update your groups on the server. The box says why. Press **Fix my groups** later. If it keeps
happening, tell an admin.

**"The identity is gone from the server's database; unlink and link again".**
The TeamSpeak server no longer knows your identity. Press **Unlink**, then link again.

**"Your groups were just checked; try again in 30 seconds".**
You pressed **Fix my groups** too soon after the last press. Wait and try again.

**I lost my server groups.**
You lose them when you lose access on the site, for example when your state changes. If the admins switched it on,
you are also kicked from the server. Ask your leadership.
