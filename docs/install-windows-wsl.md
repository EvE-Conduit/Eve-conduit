# Windows: WSL2 with the bare-metal install

Runs the normal [bare-metal Linux install](install-baremetal.md) inside Ubuntu on WSL2, with no
Docker. Useful if you want the Alliance Auth / SeAT style of setup (Supervisor, nginx, PostgreSQL or
MariaDB) on a Windows machine.

> **Heads-up:** WSL2 is built for development, not round-the-clock hosting. It's more fragile than
> [Docker Desktop](install-windows-docker.md) or the [native Windows install](../windows/README.md):
> networking needs extra setup and WSL has to be started at boot. Fine for a home setup you look after.

## What you need

- Windows 11 22H2 or newer (recommended, for *mirrored networking*), or Windows 10 22H2
- Hardware virtualisation enabled in the BIOS/UEFI
- 8 GB RAM or more, 20 GB free disk
- A domain pointing at your public IP, and ports 80/443 forwarded from your router to this PC

## 1. Install Ubuntu on WSL2

In **PowerShell as Administrator**:

```powershell
wsl --install -d Ubuntu-24.04
```

Restart if asked, then open **Ubuntu 24.04** from the Start menu and create your Linux user.

## 2. Turn on systemd

Supervisor, PostgreSQL and nginx run as systemd services. New Ubuntu installs on WSL usually have
systemd on already. Check inside Ubuntu:

```bash
systemctl is-system-running
```

If that prints an error instead of `running` or `degraded`, enable it:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Then, in PowerShell, run `wsl --shutdown` and open Ubuntu again.

## 3. Make it reachable from the network

WSL2 runs behind its own small virtual network, so Windows has to pass traffic on.

**Windows 11 22H2+ (recommended): mirrored networking.** WSL then shares Windows' network directly.
Create or edit `%UserProfile%\.wslconfig` in Notepad:

```ini
[wsl2]
networkingMode=mirrored
# Don't shut WSL down when no terminal is open:
vmIdleTimeout=-1
```

Run `wsl --shutdown` in PowerShell to apply it.

**Windows 10:** forward ports from Windows to WSL. WSL's IP address can change after a reboot, so
re-run this after each restart (or put it in the startup task from step 6):

```powershell
$ip = (wsl -d Ubuntu-24.04 hostname -I).Trim().Split(" ")[0]
netsh interface portproxy reset
netsh interface portproxy add v4tov4 listenport=80  listenaddress=0.0.0.0 connectport=80  connectaddress=$ip
netsh interface portproxy add v4tov4 listenport=443 listenaddress=0.0.0.0 connectport=443 connectaddress=$ip
```

**Both:** allow the ports through Windows Firewall (Administrator PowerShell):

```powershell
New-NetFirewallRule -DisplayName "EVECSM HTTP/HTTPS" -Direction Inbound -Protocol TCP -LocalPort 80,443 -Action Allow
```

## 4. Install EVECSM

Inside Ubuntu, keep EVECSM on the Linux file system (your home folder), not under `/mnt/c`. Windows
drives are much slower from WSL.

```bash
cd ~
cp /mnt/c/Users/<you>/Downloads/evecsm-X.Y.Z.tar.gz .
tar -xzf evecsm-X.Y.Z.tar.gz
cd evecsm-X.Y.Z
sudo ./deploy/baremetal/install.sh --domain auth.example.com --email you@example.com
```

From here everything is exactly as in the [bare-metal guide](install-baremetal.md): the setup code,
registering the EVE application, `sudo evecsm status`, upgrades and backups.

## 5. Check it

- From Windows: open `http://localhost` (mirrored mode) to see the site.
- From another device: open `https://your-domain` once DNS and port forwarding are in place.

## 6. Start WSL when Windows boots

WSL doesn't start by itself after a reboot. Create a scheduled task that starts it (Administrator
PowerShell, replace `YOURUSER` with the Windows account that installed Ubuntu):

```powershell
$action  = New-ScheduledTaskAction -Execute "wsl.exe" -Argument "-d Ubuntu-24.04 --exec /bin/sh -c 'sleep infinity'"
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit 0 -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
Register-ScheduledTask -TaskName "Start EVECSM (WSL)" -Action $action -Trigger $trigger -Settings $settings `
    -User "YOURUSER" -RunLevel Highest
```

When asked, choose **Run whether user is logged on or not** in Task Scheduler for this task. With
systemd on, starting the distro starts Supervisor, PostgreSQL/MariaDB, Redis and nginx with it.

Also set **Sleep: Never** under *Settings → System → Power*, and Windows Update **active hours**,
so the PC stays up.

## Troubleshooting

| Problem | Check |
|---|---|
| Site works on the PC but not from outside | Router forwarding, Windows Firewall rule, and (Windows 10) the portproxy IP after a reboot |
| Services stopped after closing the terminal | `vmIdleTimeout=-1` in `.wslconfig`, and the startup task |
| `systemctl` says "System has not been booted with systemd" | Step 2, then `wsl --shutdown` |
| Certificate request failed | Port 80 must reach WSL from the internet; re-run `sudo certbot --nginx -d your-domain` |
