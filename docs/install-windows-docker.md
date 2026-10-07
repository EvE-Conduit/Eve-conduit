# Windows: Docker Desktop

The easiest way to run EvE Conduit on Windows. Docker Desktop runs the same Linux containers as the
Docker install on Linux, using WSL2 (Windows' built-in Linux layer). Nothing in EvE Conduit changes.

**Good for:** a home server or an always-on PC. **Not ideal for:** a laptop that sleeps, or Windows
Server (see the [notes at the end](#windows-server)).

## What you need

- Windows 11, or Windows 10 22H2, 64-bit
- Hardware virtualisation enabled in the BIOS/UEFI (usually called Intel VT-x or AMD-V/SVM)
- 8 GB RAM or more, 20 GB free disk
- A domain name pointing at your public IP, and ports **80** and **443** forwarded from your router to this PC
- Docker Desktop is free for personal use and small organisations. Check
  [Docker's licence terms](https://www.docker.com/pricing/) if your organisation is larger.

## 1. Install WSL2 and Docker Desktop

1. Open **PowerShell as Administrator** and run:
   ```powershell
   wsl --install
   ```
   Restart when asked.
2. Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/). Keep
   **"Use WSL 2 instead of Hyper-V"** ticked.
3. Start Docker Desktop and wait until it shows **Engine running**.
4. In Docker Desktop **Settings → General**, tick **Start Docker Desktop when you sign in to your computer**.

Check it works:
```powershell
docker version
docker compose version
```

## 2. Get EvE Conduit

Docker builds EvE Conduit from its **source code**, which includes `docker-compose.yml` and `.env.example`.
Don't use the `eve-conduit-X.Y.Z.tar.gz` release download; that one is for bare-metal installs.

With [Git for Windows](https://git-scm.com/download/win):

```powershell
git clone <repository URL> C:\EvE-Conduit
cd C:\EvE-Conduit
```

Or download the repository's source ZIP, unpack it to `C:\EvE-Conduit`, and `cd` into that folder.

## 3. Configure

```powershell
copy .env.example .env
notepad .env
```

Fill in everything under **Required**:

- `CONDUIT_SECRET_KEY` and `POSTGRES_PASSWORD`: long random strings. To generate one in PowerShell:
  ```powershell
  -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 50 | ForEach-Object { [char]$_ })
  ```
- `CONDUIT_DOMAIN`, `CONDUIT_SITE_URL`, `CONDUIT_ALLOWED_HOSTS`: your domain
- `ESI_CLIENT_ID`, `ESI_SECRET_KEY`: from <https://developers.eveonline.com/applications>, with the
  callback URL `https://your-domain/sso/callback`
- `ESI_USER_AGENT_CONTACT`: your email (CCP asks every ESI application to identify itself)

## 4. Start it

```powershell
docker compose up -d --build
```

The first build takes a few minutes. Then get the one-time setup code:

```powershell
docker compose logs web | Select-String "setup code"
```

Open `https://your-domain`, sign in with your main character and enter the code.

## 5. Let the internet reach it

- **Router:** forward TCP ports 80 and 443 to this PC's local IP address.
- **Windows Firewall:** Docker Desktop usually adds rules itself. If the site isn't reachable from
  outside, run this in an Administrator PowerShell:
  ```powershell
  New-NetFirewallRule -DisplayName "EvE Conduit HTTP/HTTPS" -Direction Inbound -Protocol TCP -LocalPort 80,443 -Action Allow
  ```
- **Certificates:** Caddy gets a Let's Encrypt certificate automatically once your domain points at your
  public IP and port 80 is reachable.

## 6. Keep it running

A Windows PC isn't a server by default. Change these so the site stays up:

- **Settings → System → Power:** set *Sleep* to **Never** when plugged in.
- **Windows Update → Advanced options:** set **active hours** so restarts happen at night.
- Docker Desktop only runs while a user is signed in. Either stay signed in (lock the screen
  rather than signing out), or turn on automatic sign-in for the account that runs Docker Desktop.
- All containers have `restart: unless-stopped`, so they come back by themselves after a reboot once
  Docker Desktop has started.

## Day to day

| Task | Command (PowerShell, in the EvE Conduit folder) |
|---|---|
| Status | `docker compose ps` |
| Logs | `docker compose logs -f web` (or `worker`, `beat`) |
| Restart after editing `.env` | `docker compose up -d` |
| Back up the database | `docker compose exec db pg_dump -U conduit -Fc conduit > backup.dump` |
| Update | `git pull` (or unpack the new source next to the old one and copy your `.env` across), then `docker compose up -d --build` |
| Install a module | add it to `requirements-modules.txt`, then `docker compose up -d --build` |

## Windows Server

Docker Desktop is a Windows 10/11 product. Windows Server's own Docker engine runs *Windows* containers,
not the Linux containers EvE Conduit uses. On Windows Server, use the [native Windows install](../windows/README.md),
or a Linux virtual machine (Hyper-V) with the [Linux Docker](../README.md) or
[bare-metal](install-baremetal.md) instructions.
