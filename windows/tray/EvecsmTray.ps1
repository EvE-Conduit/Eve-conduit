#Requires -Version 5.1
<#
.SYNOPSIS
    EvE Conduit control panel in the system tray.

.DESCRIPTION
    Shows a green / amber / red icon by the clock for the health of the EvE Conduit services, checks every
    30 seconds, and pops up a notification when something goes down or recovers. Right-click for:
    open the site, the status window, start/stop/restart (asks for administrator rights), back up,
    and logs.

    Started at sign-in for every user (the installer registers it; "evecsm tray off" turns that off),
    or by hand:  powershell -NoProfile -WindowStyle Hidden -File <install folder>\tray\EvecsmTray.ps1
#>
# The Windows Forms types are loaded below with Add-Type, which the compatibility checker can't see.
[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseCompatibleTypes', '', Justification = 'System.Windows.Forms is loaded with Add-Type')]
param([string]$Root = '')

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
if (-not $Root) { $Root = Split-Path $PSScriptRoot -Parent }

Add-Type -AssemblyName System.Windows.Forms, System.Drawing
Import-Module (Join-Path $PSScriptRoot 'EvecsmHealth.psm1') -Force

# One panel per signed-in user.
$createdNew = $false
$mutex = New-Object System.Threading.Mutex($true, 'Local\EVECSM.TrayPanel', [ref]$createdNew)
if (-not $createdNew) { exit 0 }

$settingsPath = Join-Path $PSScriptRoot 'settings.json'
$adminScript = Join-Path $Root 'evecsm.ps1'
$script:Settings = Read-TraySetting $settingsPath
$script:LastOverall = ''
$script:LastHealth = $null
$script:StatusForm = $null
$script:StatusList = $null   # click handlers run after Show-StatusForm returns, so keep it at script scope

[System.Windows.Forms.Application]::EnableVisualStyles()

# --- icons, drawn at runtime so no image files are needed -------------------------------------------
function New-StatusIcon([System.Drawing.Color]$Color) {
    $bitmap = New-Object System.Drawing.Bitmap 32, 32
    $g = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $g.Clear([System.Drawing.Color]::Transparent)
        $outline = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 11, 16, 24)), 2
        $fill = New-Object System.Drawing.SolidBrush $Color
        # A hexagon, like the EvE Conduit logo.
        $points = foreach ($i in 0..5) {
            $angle = [Math]::PI / 3 * $i - [Math]::PI / 2
            New-Object System.Drawing.PointF ([float](16 + 14 * [Math]::Cos($angle))), ([float](16 + 14 * [Math]::Sin($angle)))
        }
        $g.FillPolygon($fill, [System.Drawing.PointF[]]$points)
        $g.DrawPolygon($outline, [System.Drawing.PointF[]]$points)
        $font = New-Object System.Drawing.Font 'Segoe UI', 13, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
        $format = New-Object System.Drawing.StringFormat
        $format.Alignment = [System.Drawing.StringAlignment]::Center
        $format.LineAlignment = [System.Drawing.StringAlignment]::Center
        $g.DrawString('E', $font, [System.Drawing.Brushes]::White, (New-Object System.Drawing.RectangleF 0, 1, 32, 32), $format)
    }
    finally { $g.Dispose() }
    return [System.Drawing.Icon]::FromHandle($bitmap.GetHicon())
}
$icons = @{
    Healthy      = New-StatusIcon ([System.Drawing.Color]::FromArgb(255, 52, 211, 153))
    Degraded     = New-StatusIcon ([System.Drawing.Color]::FromArgb(255, 251, 191, 36))
    Down         = New-StatusIcon ([System.Drawing.Color]::FromArgb(255, 244, 63, 94))
    NotInstalled = New-StatusIcon ([System.Drawing.Color]::FromArgb(255, 100, 116, 139))
    Checking     = New-StatusIcon ([System.Drawing.Color]::FromArgb(255, 100, 116, 139))
}
$labels = @{ Healthy = 'Healthy'; Degraded = 'Needs attention'; Down = 'Problem'; NotInstalled = 'Not installed'; Checking = 'Checking...' }

# --- actions -----------------------------------------------------------------------------------------
function Invoke-AdminCommand([string[]]$Arguments, [switch]$KeepOpen) {
    <# Runs "evecsm <args>" elevated; Windows asks for administrator rights (UAC). #>
    $argList = @('-NoProfile', '-ExecutionPolicy', 'Bypass')
    if ($KeepOpen) { $argList += '-NoExit' }
    $argList += @('-File', "`"$adminScript`"") + $Arguments
    try {
        Start-Process -FilePath 'powershell.exe' -ArgumentList $argList -Verb RunAs -WindowStyle $(if ($KeepOpen) { 'Normal' } else { 'Minimized' })
        $timer.Interval = 4000  # look again soon to show the effect
    }
    catch {
        Write-Verbose "Not run: the administrator prompt was cancelled ($($_.Exception.Message))"
    }
}

function Get-ServiceState {
    $states = [ordered]@{}
    foreach ($service in Get-Service -Name 'evecsm-*' -ErrorAction SilentlyContinue) {
        $states[$service.Name] = $service.Status.ToString()
    }
    return $states
}

function Update-Health {
    $health = Get-EvecsmHealth -Settings $script:Settings -ServiceStatus (Get-ServiceState)
    $script:LastHealth = $health
    $notify.Icon = $icons[$health.Overall]
    # NotifyIcon text is limited to 63 characters on .NET Framework.
    $text = "EvE Conduit: $($labels[$health.Overall])"
    if ($health.Overall -ne 'Healthy') { $text = "$text - $($health.Summary)" }
    $notify.Text = if ($text.Length -gt 63) { $text.Substring(0, 60) + '...' } else { $text }
    $header.Text = "EvE Conduit $($script:Settings.Version): $($labels[$health.Overall])"

    if ($script:LastOverall -and $health.Overall -ne $script:LastOverall) {
        if ($health.Overall -eq 'Healthy') {
            $notify.ShowBalloonTip(5000, 'EvE Conduit is healthy again', 'All services are running.', [System.Windows.Forms.ToolTipIcon]::Info)
        }
        elseif ($health.Overall -eq 'Down') {
            $notify.ShowBalloonTip(10000, 'EvE Conduit has a problem', $health.Summary, [System.Windows.Forms.ToolTipIcon]::Error)
        }
        elseif ($health.Overall -eq 'Degraded') {
            $notify.ShowBalloonTip(8000, 'EvE Conduit needs attention', $health.Summary, [System.Windows.Forms.ToolTipIcon]::Warning)
        }
    }
    $script:LastOverall = $health.Overall
    if ($script:StatusForm -and -not $script:StatusForm.IsDisposed) { Update-StatusForm }
}

# --- status window -------------------------------------------------------------------------------------
function Update-StatusForm {
    $list = $script:StatusForm.Tag.List
    $list.BeginUpdate()
    $list.Items.Clear()
    foreach ($item in $script:LastHealth.Items) {
        $row = New-Object System.Windows.Forms.ListViewItem $item.Name
        [void]$row.SubItems.Add($(switch ($item.Level) { 'OK' { 'OK' } 'Warning' { 'Attention' } default { 'Problem' } }))
        [void]$row.SubItems.Add($(if ($item.Port) { [string]$item.Port } else { '' }))
        [void]$row.SubItems.Add($item.Detail)
        $row.Tag = $item.Id
        $row.ForeColor = switch ($item.Level) {
            'OK' { [System.Drawing.Color]::FromArgb(255, 21, 128, 61) }
            'Warning' { [System.Drawing.Color]::FromArgb(255, 180, 83, 9) }
            default { [System.Drawing.Color]::FromArgb(255, 190, 18, 60) }
        }
        [void]$list.Items.Add($row)
    }
    $list.EndUpdate()
    $script:StatusForm.Tag.Summary.Text = "$($labels[$script:LastHealth.Overall]): $($script:LastHealth.Summary)    (checked $(Get-Date -Format 'HH:mm:ss'))"
}

function Show-StatusForm {
    if ($script:StatusForm -and -not $script:StatusForm.IsDisposed) { $script:StatusForm.Activate(); return }
    $form = New-Object System.Windows.Forms.Form
    $form.Text = "EvE Conduit $($script:Settings.Version) - service status"
    $form.Size = New-Object System.Drawing.Size 760, 380
    $form.StartPosition = 'CenterScreen'
    $form.Icon = $icons['Healthy']
    $form.Font = New-Object System.Drawing.Font 'Segoe UI', 9

    $summary = New-Object System.Windows.Forms.Label
    $summary.Dock = 'Top'
    $summary.Height = 30
    $summary.Padding = New-Object System.Windows.Forms.Padding 8, 8, 8, 0
    $summary.Font = New-Object System.Drawing.Font 'Segoe UI', 9.5, ([System.Drawing.FontStyle]::Bold)

    $list = New-Object System.Windows.Forms.ListView
    $list.View = 'Details'
    $list.FullRowSelect = $true
    $list.MultiSelect = $false
    $list.Dock = 'Fill'
    foreach ($col in @(@('Component', 220), @('Status', 90), @('Port', 60), @('Details', 360))) { [void]$list.Columns.Add($col[0], $col[1]) }

    $buttons = New-Object System.Windows.Forms.FlowLayoutPanel
    $buttons.Dock = 'Bottom'
    $buttons.Height = 44
    $buttons.Padding = New-Object System.Windows.Forms.Padding 6
    function Add-Button([string]$Text, [scriptblock]$OnClick) {
        $b = New-Object System.Windows.Forms.Button
        $b.Text = $Text
        $b.AutoSize = $true
        $b.Add_Click($OnClick)
        $buttons.Controls.Add($b)
    }
    Add-Button 'Refresh' { Update-Health }
    Add-Button 'Restart selected' {
        if ($script:StatusList.SelectedItems.Count) { Invoke-AdminCommand @('restart', ($script:StatusList.SelectedItems[0].Tag -replace '^evecsm-', '')) }
    }
    Add-Button 'Restart all' { Invoke-AdminCommand @('restart') }
    Add-Button 'Open site' { Start-Process $script:Settings.SiteUrl }
    Add-Button 'Show log' {
        $name = if ($script:StatusList.SelectedItems.Count) { $script:StatusList.SelectedItems[0].Tag -replace '^evecsm-', '' } else { 'web' }
        Invoke-AdminCommand @('logs', $name) -KeepOpen
    }

    $form.Controls.Add($list)
    $form.Controls.Add($summary)
    $form.Controls.Add($buttons)
    $form.Tag = @{ List = $list; Summary = $summary }
    $script:StatusList = $list
    $script:StatusForm = $form
    if ($script:LastHealth) { Update-StatusForm }
    $form.Show()
}

# --- tray icon and menu -----------------------------------------------------------------------------------
$notify = New-Object System.Windows.Forms.NotifyIcon
$notify.Icon = $icons['Checking']
$notify.Text = 'EvE Conduit: checking...'
$notify.Visible = $true

$menu = New-Object System.Windows.Forms.ContextMenuStrip
$header = $menu.Items.Add('EvE Conduit')
$header.Enabled = $false
[void]$menu.Items.Add('-')
$menu.Items.Add('Open site').Add_Click({ Start-Process $script:Settings.SiteUrl })
$menu.Items.Add('Service status...').Add_Click({ Show-StatusForm })
[void]$menu.Items.Add('-')
$menu.Items.Add('Restart all services').Add_Click({ Invoke-AdminCommand @('restart') })
$menu.Items.Add('Start all services').Add_Click({ Invoke-AdminCommand @('start') })
$menu.Items.Add('Stop all services').Add_Click({
        $ok = [System.Windows.Forms.MessageBox]::Show('Stop all EvE Conduit services? The site goes offline until you start them again.', 'EvE Conduit', 'YesNo', 'Warning')
        if ($ok -eq 'Yes') { Invoke-AdminCommand @('stop') }
    })
[void]$menu.Items.Add('-')
$menu.Items.Add('Back up now').Add_Click({ Invoke-AdminCommand @('backup') -KeepOpen })
$menu.Items.Add('Show web log').Add_Click({ Invoke-AdminCommand @('logs', 'web') -KeepOpen })
[void]$menu.Items.Add('-')
$menu.Items.Add('Close this panel').Add_Click({ $timer.Stop(); $notify.Visible = $false; [System.Windows.Forms.Application]::Exit() })
$notify.ContextMenuStrip = $menu
$notify.Add_DoubleClick({ Show-StatusForm })

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 1000
$timer.Add_Tick({
        $timer.Interval = 30000
        try { Update-Health }
        catch {
            $notify.Icon = $icons['NotInstalled']
            $notify.Text = 'EvE Conduit: status check failed'
        }
    })
$timer.Start()

try { [System.Windows.Forms.Application]::Run() }
finally {
    $notify.Visible = $false
    $notify.Dispose()
    $mutex.ReleaseMutex()
}
