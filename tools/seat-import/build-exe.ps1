# Builds the SeAT import window as one Windows program: dist\EvE-Conduit-SeAT-Import[-X.Y.Z].exe.
# Needs Python 3.8+ from python.org (its tkinter is included). Run from anywhere:
#   powershell -ExecutionPolicy Bypass -File tools\seat-import\build-exe.ps1
param(
    [string]$Version = '',
    [string]$OutDir = (Join-Path (Get-Location) 'dist'),
    [string]$Python = 'python'
)
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$name = if ($Version) { "EvE-Conduit-SeAT-Import-$Version" } else { 'EvE-Conduit-SeAT-Import' }
$work = Join-Path ([IO.Path]::GetTempPath()) 'conduit-seat-import-build'

& $Python -m pip install --quiet --disable-pip-version-check 'pyinstaller==6.11.1'
if ($LASTEXITCODE) { throw "Installing PyInstaller failed ($LASTEXITCODE)" }
& $Python -m PyInstaller --noconfirm --clean --onefile --windowed --name $name --paths $here `
    --distpath $OutDir --workpath $work --specpath $work (Join-Path $here 'seat_import_gui.py')
if ($LASTEXITCODE) { throw "PyInstaller failed ($LASTEXITCODE)" }
Remove-Item -Recurse -Force $work -ErrorAction SilentlyContinue
Write-Host "Built $(Join-Path $OutDir "$name.exe")"
