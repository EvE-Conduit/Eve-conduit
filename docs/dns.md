# Pointing a domain at your server

Every EvE Conduit install needs an address members can type into a browser, such as
`https://auth.example.com`. That means a **domain name** whose DNS points at your server's public IP
address. This guide explains how to set that up if you have never done it before. It applies to all
three installs ([Docker](install-docker.md), [Linux](install-linux.md), [Windows](install-windows.md)).

**How long it takes:** 10 minutes, plus a wait of a few minutes for DNS to update.

## The idea in one paragraph

DNS is the internet's phone book. When someone opens `auth.example.com`, their browser asks DNS "what IP
address is that?", gets an answer like `203.0.113.7`, and connects there. You create that entry (an
**A record**) at the company where your domain is managed. After that, Let's Encrypt can check that the
name really leads to your server and give it a free HTTPS certificate, which the install does by itself.

## 1. Get a domain

If you already own one (for your corporation's website, say), use it: EvE Conduit lives happily on a
subdomain like `auth.yourcorp.com`, next to whatever is already there.

If not, buy one from a registrar. Any works; Cloudflare, Namecheap, Porkbun and Gandi are common and
cost around 10 EUR/USD a year for a `.com`, less for many others. You only need the domain, not any
hosting, email or "SSL" add-ons the registrar may offer.

## 2. Find your server's public IP address

The A record needs the address the internet sees your server at.

- **A rented server (VPS, cloud)**: the provider's control panel shows it. It is fixed.
- **A PC at home**: open <https://whatismyip.com> (or search "what is my IP") from that PC and note
  the **IPv4** address (four numbers with dots, like `84.12.34.56`). This is your router's address;
  every device behind it shares it.

Two checks for a home connection:

- **Is the address fixed?** Most home connections get a new address now and then (after a router
  reboot, or every few days). If yours changes, see [Home connections with a changing IP](#home-connections-with-a-changing-ip)
  below.
- **Is it really public?** If the address starts with `10.`, `192.168.`, `172.16.` to `172.31.` or
  `100.64.` to `100.127.`, your provider puts you behind a shared address (carrier-grade NAT) and the
  internet cannot reach your PC at all. Ask your provider for a public IPv4 address (some do it on
  request or for a small fee), or rent a small server instead.

## 3. Choose a name

Pick a subdomain for EvE Conduit, such as `auth`, `conduit` or `hq`. The full name is then
`auth.example.com`. Using a subdomain leaves the bare domain (`example.com`) free for a website.

You can also use the bare domain itself if you have nothing else on it; the record is then often shown
as `@` instead of a name.

## 4. Create the A record

Log in where your domain's DNS is managed. Usually that is the registrar you bought it from; look for
**DNS**, **DNS settings**, **Manage DNS**, **Zone editor** or **Advanced DNS**. Add a record with these
values:

| Field | Value |
|---|---|
| **Type** | `A` |
| **Name** (or Host) | `auth` (just the subdomain part; some panels want the full `auth.example.com`, and `@` means the bare domain) |
| **Value** (or Points to, Address, Target, Content) | your public IPv4 address, for example `203.0.113.7` |
| **TTL** | leave the default (`Auto`, `3600` or similar) |

Save it. Where to find this in the most common panels:

- **Cloudflare**: *DNS → Records → Add record*. Set the **Proxy status** to **DNS only** (grey cloud),
  not Proxied (orange cloud). The proxy sits between members and your server, which breaks the
  certificate setup and makes every visitor look like they come from Cloudflare's addresses.
- **Namecheap**: *Domain List → Manage → Advanced DNS → Add new record*.
- **Porkbun**: *Domain management → DNS records*.
- **GoDaddy**: *My Products → DNS → Add new record*.
- **Squarespace (ex Google Domains)**: *Domains → DNS → Custom records*.
- **Hetzner, OVH, IONOS, Strato and others**: the domain's *DNS* or *Zone* page.

Do **not** add an `AAAA` record (IPv6) unless you know your server is reachable over IPv6. Let's
Encrypt prefers IPv6 when an AAAA record exists, and a record that leads nowhere makes the certificate
request fail. Do not add a `CNAME` for the same name either; one A record is all that is needed.

## 5. Check it

DNS changes take anywhere from a minute to an hour to reach everyone. Check from the server itself,
since that is where the certificate request comes from:

| Where | Command |
|---|---|
| Linux (Docker or bare) | `getent hosts auth.example.com` |
| Windows (PowerShell) | `Resolve-DnsName auth.example.com -Type A` |
| Any OS | `nslookup auth.example.com` |

It should print your public IP address. <https://dnschecker.org> shows what DNS servers around the
world currently answer, which is handy while waiting. Until the right address shows up, the installer's
certificate request fails; that is harmless, and the install guides say how to retry it.

## 6. On a home connection: open the ports

A rented server is reachable as soon as DNS is right (apart from the provider's firewall, which the
install guides cover). A PC at home sits behind a router, which has to pass web traffic on:

1. Give the PC a fixed address on your home network. In the router, this is usually called a **DHCP
   reservation** or **static lease**: pick the PC in the list of devices and tick "always use this
   address". (Linux: `ip addr`; Windows: `ipconfig`, the *IPv4 Address* line, shows the current one.)
2. In the router's **Port forwarding** (also called NAT, virtual server or applications) page, add two
   rules: external port **80** to the PC's address, port 80, protocol **TCP**; and external port **443**
   to the PC's address, port 443, **TCP**.
3. Test from outside your network, for example from a phone with Wi-Fi switched off, by opening
   `http://auth.example.com`. <https://canyouseeme.org> can check port 80 and 443 for you.

Some providers block incoming port 80 or 443 on home connections. If both the forwarding and the
firewall are right and nothing arrives, ask the provider.

## Home connections with a changing IP

If your public address changes, the A record goes stale and members cannot reach the site, so the
record has to follow the address. There are two ways.

**Dynamic DNS (DDNS) built into the router.** Many routers (AVM Fritz!Box, ASUS, TP-Link, Netgear,
Ubiquiti and others) can update a DNS name whenever the address changes. Look under *Internet*,
*Advanced* or *WAN* for **DDNS** or **Dynamic DNS**. Two common setups:

- The router updates a name at a DDNS service such as DuckDNS, No-IP or Dynu, giving you a name like
  `yourcorp.duckdns.org`. You can use that name directly as EvE Conduit's domain. Or keep your own
  domain and add a `CNAME` record for `auth` pointing at `yourcorp.duckdns.org` instead of an A record.
- Some routers can update your own domain directly if its DNS provider offers an update API (Cloudflare,
  Namecheap and Porkbun do, among others). The router manual says which services it supports.

**A small script on the server.** DNS providers with an API (Cloudflare, Porkbun, Hetzner, deSEC and
others) publish a command that updates a record. Run it from a cron job (Linux) or scheduled task
(Windows) every five minutes: it looks up the current public address and changes the A record when it
differs. The provider's documentation has ready-made scripts; search for "`<provider>` dynamic DNS
script".

A fixed address is still better: the EVE login's callback URL and the HTTPS certificate are tied to the
name, and a name that lags behind an address change means a short outage each time. Many providers sell
a static IP for a few euros a month.

## Using an IP address with no domain at all

If you have a **fixed public IPv4 address** you can skip DNS entirely and use the address as the site's
name (`https://203.0.113.7`). Each install guide has a section on it. Let's Encrypt issues certificates
for IP addresses too, but only short-lived ones (six days), which the install renews by itself. It does
not work with a changing address, a private address or carrier-grade NAT, and members have to remember
numbers instead of a name, so a domain is the better choice whenever you can get one.

## Troubleshooting

| Problem | What to check |
|---|---|
| `nslookup` says the name does not exist | The record was saved under the wrong domain, or with the full name in a panel that wanted only the subdomain (giving `auth.example.com.example.com`). Open the record and read the name back. Also wait a few minutes: new records take time. |
| It resolves to the wrong address | A typo, or an old record for the same name. Delete duplicates; keep one A record. |
| Resolves right on the server but members see an old address | Their DNS cache still holds the old answer. It expires after the record's TTL (often an hour). Nothing to do but wait. |
| Cloudflare: certificate errors or redirect loops | The record is **Proxied** (orange cloud). Switch it to **DNS only**. |
| Certificate request fails though DNS is right | Port 80 must reach the server from the internet: router forwarding, the server's firewall and the hosting provider's firewall or security group. If an AAAA record exists, remove it unless IPv6 really works. |
| Works at home, not from outside | Testing from inside your own network goes through the router's public side, which many home routers cannot do (no "NAT loopback"). Test from a phone on mobile data instead. |
