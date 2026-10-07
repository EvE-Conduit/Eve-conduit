# EvE Conduit Windows setup (EvE-Conduit-Setup-X.Y.Z.exe)

A normal Windows installer wizard, built with [Inno Setup](https://jrsoftware.org/isinfo.php) 6.3+. It
wraps the native Windows install described in [../README.md](../README.md): the wizard asks the
questions, then runs `windows\install.ps1` non-interactively. Nothing about the install itself is
different, so everything in that README (folder layout, ports, the `conduit` command, the tray panel)
applies.

| File | What it is |
|---|---|
| `conduit.iss` | The setup script: wizard pages, checks, running the install, finish page |
| `Setup.ps1` | Run by the setup (not by hand): `-Mode Check`, `Install` or `Upgrade` |
| `ConduitSetup.psm1` | Helpers for Setup.ps1, unit-tested in `windows/tests/ConduitSetup.Tests.ps1` |
| `build.ps1` | Builds `dist\EvE-Conduit-Setup-<version>.exe` |

## How it works

1. **Existing install?** The setup looks for the "Apps & features" entry install.ps1 creates
   (`HKLM\...\Uninstall\EveConduit`). If an older version is installed it offers to **upgrade** and
   skips the questions; the same or a newer version stops the setup. Services without that entry
   (a half-removed install) stop it too, with a pointer to `conduit uninstall`.
2. **Questions:** install folder (default `C:\EvE-Conduit`), domain and email, HTTPS or plain HTTP,
   PostgreSQL or MariaDB, ports, whether the router forwards 80/443 (only when the web ports differ),
   and optionally the EVE application's Client ID and Secret Key, with the callback URL to register.
3. **Check:** before the Ready page, `Setup.ps1 -Mode Check` runs the same rules as install.ps1 on the
   real machine: folder naming and drive (local, 5 GB free, empty), domain, and every port for clashes,
   programs already listening and ranges Windows reserves (Hyper-V/WSL/Docker).
4. **Install:** the bundled release zip is unpacked to Setup's temporary folder and install.ps1 runs
   with `-Yes` and the answers. Its output fills the progress page (each `==> [n/m]` step moves the
   bar) and the log. The answers are passed in a temporary file, deleted as soon as it's read, so the
   EVE secret never appears on a command line. Upgrades run `<install folder>\conduit.ps1 upgrade <zip>`
   (backup, install, migrate, restart; it puts the old release back if installing fails).
5. **Finish:** the site address and the one-time setup code (from install.ps1's `-ResultFile`), and an
   option to open the site.

**Log:** `<install folder>\logs\installer.log`, or `%TEMP%\EvE-Conduit-installer.log` if the install
failed before the folder existed. On failure the setup also shows the last lines.

**Uninstalling:** Setup registers no uninstaller of its own (`Uninstallable=no`). install.ps1 registers
the single "Apps & features" entry, which runs `uninstall.ps1` (it asks whether to keep the settings,
data and backups). `conduit uninstall` does the same. This keeps one entry whether EvE Conduit was
installed with the setup or with PowerShell, and `conduit upgrade` keeps its version current.

## Silent installs

Every question can be answered on the command line; `/VERYSILENT` (or `/SILENT`) then installs without
the wizard. Without `/DIR` the folder is `C:\EvE-Conduit`.

```bat
EvE-Conduit-Setup-0.4.0.exe /VERYSILENT /SUPPRESSMSGBOXES /DIR="D:\EvE-Conduit" /DOMAIN=auth.example.com ^
  /EMAIL=you@example.com /DATABASE=Postgres /ESICLIENTID=... /ESISECRET=... /LOG="%TEMP%\setup.log"
```

Also: `/NOTLS=1`, `/HTTPPORT=`, `/HTTPSPORT=`, `/APPPORT=`, `/CACHEPORT=`, `/DATABASEPORT=` and
`/PUBLICPORTS=Standard|AsChosen`. In silent mode the wizard's own checks don't run, but install.ps1
applies the same ones and stops on a problem. Note that `/ESISECRET` is visible in the process list
while the setup runs; leave it out and add it to `config\conduit.env` afterwards if that matters.

## Building

On Windows with the release zip already built (`bash windows/build-release.sh` on Linux, macOS or WSL):

```powershell
pwsh windows/installer/build.ps1            # or: powershell -File windows\installer\build.ps1
```

It reads the version from `backend/pyproject.toml`, finds `ISCC.exe` (installing Inno Setup with
Chocolatey if it's missing) and writes `dist\EvE-Conduit-Setup-<version>.exe`. `-Zip` and `-Version`
override the defaults.

**Code signing:** the setup isn't signed yet, so SmartScreen shows "Windows protected your PC" until the
download builds reputation; users choose **More info → Run anyway**. With a certificate, set
`CONDUIT_SIGN_CERT` (path to a .pfx), `CONDUIT_SIGN_PASSWORD` and optionally `CONDUIT_SIGN_TIMESTAMP`, and
build.ps1 signs the setup with signtool.
