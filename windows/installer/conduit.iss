; EvE Conduit graphical installer (Inno Setup 6.3 or newer).
;
; Wraps the native Windows install: the wizard asks the questions, then runs windows\install.ps1
; non-interactively (or "conduit upgrade" when EvE Conduit is already installed). Build it with
; windows\installer\build.ps1, which passes /DAppVersion and /DReleaseZip.
;
; The setup itself installs no files and registers no uninstaller: install.ps1 does the install and
; registers the single "Apps & features" entry, which runs uninstall.ps1. See README.md here.

#ifndef AppVersion
  #define AppVersion "0.0.0"
#endif
#ifndef ReleaseZip
  #define ReleaseZip "..\..\dist\eve-conduit-" + AppVersion + "-windows.zip"
#endif
#define ZipName ExtractFileName(ReleaseZip)

#if Ver < EncodeVer(6, 3, 0)
  #error Inno Setup 6.3 or newer is required (ExecAndLogOutput, ExecAndCaptureOutput).
#endif

[Setup]
AppId={{987F9B1E-0CDA-4A5F-8166-BA965481FEC5}
AppName=EvE Conduit
AppVersion={#AppVersion}
AppVerName=EvE Conduit {#AppVersion}
AppPublisher=EvE Conduit
AppPublisherURL=https://github.com/EvE-Conduit/Eve-conduit
AppSupportURL=https://github.com/EvE-Conduit/Eve-conduit/issues
AppUpdatesURL=https://github.com/EvE-Conduit/Eve-conduit/releases
VersionInfoVersion={#AppVersion}
DefaultDirName=C:\EvE-Conduit
AppendDefaultDirName=no
DirExistsWarning=no
UsePreviousAppDir=no
DisableProgramGroupPage=yes
; install.ps1 registers the one "Apps & features" entry (and conduit upgrade keeps it current).
Uninstallable=no
CreateUninstallRegKey=no
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0.17763
WizardStyle=modern
OutputDir=..\..\dist
OutputBaseFilename=EvE-Conduit-Setup-{#AppVersion}
Compression=lzma2
SolidCompression=yes
SetupLogging=yes

[Files]
; Extracted on demand to {tmp} (dontcopy); nothing is copied into the install folder by Setup itself.
Source: "{#ReleaseZip}"; Flags: dontcopy nocompression
Source: "Setup.ps1"; Flags: dontcopy
Source: "ConduitSetup.psm1"; Flags: dontcopy
Source: "..\scripts\Conduit.psm1"; Flags: dontcopy

[Run]
Filename: "{code:GetSiteUrl}"; Description: "Open EvE Conduit in the browser"; Flags: postinstall shellexec nowait skipifsilent

[Code]
const
  UninstallKey = 'SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\EveConduit';
  WebServiceKey = 'SYSTEM\CurrentControlSet\Services\conduit-web';
  TailSize = 14;

var
  Upgrading: Boolean;
  InstalledRoot, InstalledVersion: String;
  SitePage, PortPage, EsiPage: TInputQueryWizardPage;
  ConnPage, DbPage, PublicPage: TInputOptionWizardPage;
  ProgressPage: TOutputProgressWizardPage;
  Tail: TStringList;
  LogPath, KeptLogPath: String;
  ResultSiteUrl, ResultSetupCode, ResultVersion: String;

{ --- small helpers ------------------------------------------------------------------------------ }

function PowerShellExe(): String;
begin
  Result := ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe');
end;

function ValuesPath(): String;
begin
  Result := ExpandConstant('{tmp}\answers.txt');
end;

function ResultPath(): String;
begin
  Result := ExpandConstant('{tmp}\result.txt');
end;

function ScriptArgs(Mode: String): String;
begin
  Result := '-NoProfile -ExecutionPolicy Bypass -File "' + ExpandConstant('{tmp}\Setup.ps1') + '" -Mode ' + Mode +
    ' -ValuesFile "' + ValuesPath() + '" -Zip "' + ExpandConstant('{tmp}\{#ZipName}') + '" -ResultFile "' + ResultPath() + '"';
end;

function IsHostChar(C: Char): Boolean;
begin
  Result := ((C >= 'a') and (C <= 'z')) or ((C >= 'A') and (C <= 'Z')) or ((C >= '0') and (C <= '9')) or (C = '.') or (C = '-');
end;

function CleanDomain(): String;
var
  S: String;
begin
  S := Trim(SitePage.Values[0]);
  if Pos('://', S) > 0 then
    S := Copy(S, Pos('://', S) + 3, Length(S));
  while (Length(S) > 0) and (S[Length(S)] = '/') do
    S := Copy(S, 1, Length(S) - 1);
  Result := S;
end;

function ValidDomain(S: String): Boolean;
var
  I: Integer;
begin
  Result := Length(S) > 0;
  for I := 1 to Length(S) do
    if not IsHostChar(S[I]) then
    begin
      Result := False;
      Exit;
    end;
end;

function NoTls(): Boolean;
begin
  Result := ConnPage.SelectedValueIndex = 1;
end;

function UseMariaDb(): Boolean;
begin
  Result := DbPage.SelectedValueIndex = 1;
end;

function PortValue(Index, Default: Integer): Integer;
begin
  Result := StrToIntDef(Trim(PortPage.Values[Index]), Default);
end;

function CustomWebPorts(): Boolean;
begin
  Result := (PortValue(0, 80) <> 80) or ((not NoTls()) and (PortValue(1, 443) <> 443));
end;

function StandardPublicPorts(): Boolean;
begin
  Result := (not CustomWebPorts()) or (PublicPage.SelectedValueIndex = 0);
end;

function ComputeSiteUrl(): String;
begin
  if NoTls() then
  begin
    if StandardPublicPorts() or (PortValue(0, 80) = 80) then
      Result := 'http://' + CleanDomain()
    else
      Result := 'http://' + CleanDomain() + ':' + IntToStr(PortValue(0, 80));
  end
  else
  begin
    if StandardPublicPorts() or (PortValue(1, 443) = 443) then
      Result := 'https://' + CleanDomain()
    else
      Result := 'https://' + CleanDomain() + ':' + IntToStr(PortValue(1, 443));
  end;
end;

function GetSiteUrl(Param: String): String;
begin
  if ResultSiteUrl <> '' then
    Result := ResultSiteUrl
  else
    Result := ComputeSiteUrl();
end;

function BoolText(Value: Boolean): String;
begin
  if Value then Result := '1' else Result := '0';
end;

{ The wizard's answers for Setup.ps1, one Key=Value per line. The secret is only included for the
  real install; Setup.ps1 deletes the file as soon as it has read it. }
function ValuesText(IncludeSecret: Boolean): String;
var
  Root, PublicPorts, Database: String;
begin
  if Upgrading then Root := InstalledRoot else Root := WizardDirValue();
  if not CustomWebPorts() then PublicPorts := ''
  else if PublicPage.SelectedValueIndex = 0 then PublicPorts := 'Standard'
  else PublicPorts := 'AsChosen';
  if UseMariaDb() then Database := 'MariaDB' else Database := 'Postgres';
  Result :=
    'InstallRoot=' + Root + #13#10 +
    'Domain=' + CleanDomain() + #13#10 +
    'Email=' + Trim(SitePage.Values[1]) + #13#10 +
    'Database=' + Database + #13#10 +
    'NoTls=' + BoolText(NoTls()) + #13#10 +
    'HttpPort=' + Trim(PortPage.Values[0]) + #13#10 +
    'HttpsPort=' + Trim(PortPage.Values[1]) + #13#10 +
    'AppPort=' + Trim(PortPage.Values[2]) + #13#10 +
    'CachePort=' + Trim(PortPage.Values[3]) + #13#10 +
    'DatabasePort=' + Trim(PortPage.Values[4]) + #13#10 +
    'PublicPorts=' + PublicPorts + #13#10 +
    'EsiClientId=' + Trim(EsiPage.Values[0]) + #13#10;
  if IncludeSecret then
    Result := Result + 'EsiSecret=' + Trim(EsiPage.Values[1]) + #13#10;
end;

{ --- existing install ------------------------------------------------------------------------- }

function InitializeSetup(): Boolean;
var
  Installed, ThisOne: Int64;
begin
  Result := True;
  Upgrading := False;
  InstalledRoot := '';
  InstalledVersion := '';
  if RegQueryStringValue(HKLM64, UninstallKey, 'InstallLocation', InstalledRoot) and (InstalledRoot <> '') then
  begin
    RegQueryStringValue(HKLM64, UninstallKey, 'DisplayVersion', InstalledVersion);
    if StrToVersion(InstalledVersion, Installed) and StrToVersion('{#AppVersion}', ThisOne) and
       (ComparePackedVersion(Installed, ThisOne) >= 0) then
    begin
      SuppressibleMsgBox('EvE Conduit ' + InstalledVersion + ' is already installed in ' + InstalledRoot +
        ', which is the same as or newer than this setup ({#AppVersion}).', mbInformation, MB_OK, IDOK);
      Result := False;
      Exit;
    end;
    if SuppressibleMsgBox('EvE Conduit ' + InstalledVersion + ' is installed in ' + InstalledRoot + '.' + #13#10#13#10 +
      'Upgrade it to {#AppVersion}? A backup is made first, the site is down for a few minutes, and ' +
      '"conduit rollback" returns to the current version if needed.', mbConfirmation, MB_YESNO, IDYES) = IDYES then
      Upgrading := True
    else
      Result := False;
  end
  else if RegKeyExists(HKLM64, WebServiceKey) then
  begin
    SuppressibleMsgBox('EvE Conduit services exist on this machine but its install folder isn''t registered. ' +
      'Remove the old install first (in an Administrator terminal: conduit uninstall), then run this setup again.',
      mbError, MB_OK, IDOK);
    Result := False;
  end;
end;

{ --- wizard pages ----------------------------------------------------------------------------- }

procedure InitializeWizard();
begin
  Tail := TStringList.Create;
  ExtractTemporaryFile('Setup.ps1');
  ExtractTemporaryFile('ConduitSetup.psm1');
  ExtractTemporaryFile('Conduit.psm1');

  SitePage := CreateInputQueryPage(wpSelectDir, 'Your site', 'Where will members reach EvE Conduit?',
    'Enter the domain name that points at this machine (a DNS record for it must exist), and an email ' +
    'address. The email is used for the HTTPS certificate (Let''s Encrypt) and as the contact CCP sees for ESI.');
  SitePage.Add('Domain name, e.g. auth.example.com:', False);
  SitePage.Add('Email address:', False);
  SitePage.Values[0] := ExpandConstant('{param:Domain|}');
  SitePage.Values[1] := ExpandConstant('{param:Email|}');

  ConnPage := CreateInputOptionPage(SitePage.ID, 'Connection', 'How should the site be served?',
    'Choose HTTPS unless this machine is only reachable on your local network, or another proxy in front of it already handles HTTPS.',
    True, False);
  ConnPage.Add('HTTPS with a free, automatic Let''s Encrypt certificate (recommended)');
  ConnPage.Add('Plain HTTP only');
  if ExpandConstant('{param:NoTls|0}') = '1' then ConnPage.SelectedValueIndex := 1 else ConnPage.SelectedValueIndex := 0;

  DbPage := CreateInputOptionPage(ConnPage.ID, 'Database', 'Which database should EvE Conduit use?',
    'It is installed inside the install folder and only listens on this machine.', True, False);
  DbPage.Add('PostgreSQL (recommended)');
  DbPage.Add('MariaDB');
  if CompareText(ExpandConstant('{param:Database|Postgres}'), 'MariaDB') = 0 then DbPage.SelectedValueIndex := 1 else DbPage.SelectedValueIndex := 0;

  PortPage := CreateInputQueryPage(DbPage.ID, 'Ports', 'Which ports should EvE Conduit use?',
    'The suggested ports suit most machines. Change one only if another program already uses it; Setup checks before installing.');
  PortPage.Add('Web server, HTTP (public):', False);
  PortPage.Add('Web server, HTTPS (public):', False);
  PortPage.Add('EvE Conduit application (this machine only):', False);
  PortPage.Add('Cache and task queue (this machine only):', False);
  PortPage.Add('Database (this machine only):', False);
  PortPage.Values[0] := ExpandConstant('{param:HttpPort|80}');
  PortPage.Values[1] := ExpandConstant('{param:HttpsPort|443}');
  PortPage.Values[2] := ExpandConstant('{param:AppPort|8000}');
  PortPage.Values[3] := ExpandConstant('{param:CachePort|6379}');
  if DbPage.SelectedValueIndex = 1 then
    PortPage.Values[4] := ExpandConstant('{param:DatabasePort|3306}')
  else
    PortPage.Values[4] := ExpandConstant('{param:DatabasePort|5432}');

  PublicPage := CreateInputOptionPage(PortPage.ID, 'Public ports', 'Your web ports are not the standard 80 and 443',
    'How will members reach the site?', True, False);
  PublicPage.Add('My router or firewall forwards the public ports 80 and 443 to these ports, so the address has no port number');
  PublicPage.Add('Members use these ports directly, so the address includes the port number');
  if CompareText(ExpandConstant('{param:PublicPorts|Standard}'), 'AsChosen') = 0 then PublicPage.SelectedValueIndex := 1 else PublicPage.SelectedValueIndex := 0;

  EsiPage := CreateInputQueryPage(PublicPage.ID, 'EVE Online login', 'Connect your EVE application (optional)', '');
  EsiPage.Add('Client ID:', False);
  EsiPage.Add('Secret Key:', True);
  EsiPage.Values[0] := ExpandConstant('{param:EsiClientId|}');
  EsiPage.Values[1] := ExpandConstant('{param:EsiSecret|}');

  ProgressPage := CreateOutputProgressPage('Installing EvE Conduit',
    'This takes about 5 to 15 minutes. Components are downloaded, checked and set up inside the install folder.');

  if Upgrading then
    WizardForm.DirEdit.Text := InstalledRoot;
end;

function ShouldSkipPage(PageID: Integer): Boolean;
begin
  Result := False;
  if Upgrading then
    Result := (PageID = wpSelectDir) or (PageID = SitePage.ID) or (PageID = ConnPage.ID) or (PageID = DbPage.ID) or
      (PageID = PortPage.ID) or (PageID = PublicPage.ID) or (PageID = EsiPage.ID)
  else if PageID = PublicPage.ID then
    Result := not CustomWebPorts();
end;

procedure CurPageChanged(CurPageID: Integer);
var
  Text: String;
begin
  if CurPageID = PortPage.ID then
    PortPage.Edits[1].Enabled := not NoTls()
  else if CurPageID = EsiPage.ID then
    EsiPage.SubCaptionLabel.Caption :=
      'Members sign in with their EVE characters through an application you register with CCP. Create one at ' +
      'https://developers.eveonline.com/applications with this callback URL:' + #13#10#13#10 +
      '    ' + ComputeSiteUrl() + '/sso/callback' + #13#10#13#10 +
      'and paste its Client ID and Secret Key here. You can also leave both empty and add them later in ' +
      'config\conduit.env (then run: conduit restart).'
  else if CurPageID = wpFinished then
  begin
    if Upgrading then
      Text := 'EvE Conduit was upgraded to ' + ResultVersion + '.'
    else
      Text := 'EvE Conduit ' + ResultVersion + ' is installed in ' + WizardDirValue() + '.';
    Text := Text + #13#10#13#10 + 'Site: ' + GetSiteUrl('');
    if ResultSetupCode <> '' then
      // (No line may start with "#": the preprocessor would read it as a directive.)
      Text := Text + #13#10#13#10 + 'Sign in with your main character, then enter this one-time setup code to become the administrator:' + #13#10#13#10 +
        '    ' + ResultSetupCode
    else if not Upgrading then
      Text := Text + #13#10#13#10 + 'To show the one-time setup code, run in an Administrator terminal: conduit setup-code';
    Text := Text + #13#10#13#10 + 'Day to day: conduit status | logs | backup | upgrade. The installer log is in ' + KeptLogPath + '.';
    WizardForm.FinishedLabel.Caption := Text;
  end;
end;

{ Runs Setup.ps1 -Mode Check: folder, domain and port problems, with the real machine's ports. }
function CheckAnswers(var Problems: String): Boolean;
var
  Output: TExecOutput;
  Code, I: Integer;
  Line: String;
begin
  Problems := '';
  SaveStringToFile(ValuesPath(), ValuesText(False), False);
  try
    if not ExecAndCaptureOutput(PowerShellExe(), ScriptArgs('Check'), ExpandConstant('{tmp}'), SW_HIDE, ewWaitUntilTerminated, Code, Output) then
    begin
      Problems := 'Setup could not run PowerShell to check these settings: ' + SysErrorMessage(Code);
      Result := False;
      Exit;
    end;
    for I := 0 to GetArrayLength(Output.StdOut) - 1 do
    begin
      Line := Output.StdOut[I];
      if Pos('PROBLEM: ', Line) = 1 then
        Problems := Problems + '- ' + Copy(Line, 10, Length(Line)) + #13#10;
    end;
    if (Code <> 0) and (Problems = '') then
    begin
      Problems := 'Checking the settings failed (exit code ' + IntToStr(Code) + '):' + #13#10;
      for I := 0 to GetArrayLength(Output.StdErr) - 1 do
        if I < 10 then Problems := Problems + Output.StdErr[I] + #13#10;
    end;
  finally
    DeleteFile(ValuesPath());
  end;
  Result := Problems = '';
end;

function NextButtonClick(CurPageID: Integer): Boolean;
var
  Dir, Problems: String;
begin
  Result := True;
  if CurPageID = wpSelectDir then
  begin
    Dir := WizardDirValue();
    if (Length(Dir) <= 3) then
    begin
      MsgBox('Don''t install into the root of a drive; use a folder such as C:\EvE-Conduit.', mbError, MB_OK);
      Result := False;
    end
    else if Length(Dir) > 80 then
    begin
      MsgBox('Keep the path under 80 characters; files deep inside it would hit Windows'' path length limit.', mbError, MB_OK);
      Result := False;
    end;
  end
  else if CurPageID = SitePage.ID then
  begin
    if not ValidDomain(CleanDomain()) then
    begin
      MsgBox('Enter just the domain name, e.g. auth.example.com (no https://, port or path).', mbError, MB_OK);
      Result := False;
    end
    else if (Pos('@', SitePage.Values[1]) < 2) or (Pos('.', SitePage.Values[1]) = 0) then
    begin
      MsgBox('Enter a valid email address.', mbError, MB_OK);
      Result := False;
    end;
  end
  else if CurPageID = DbPage.ID then
  begin
    { Keep the database port in step with the chosen database while it's still a default. }
    if UseMariaDb() and (Trim(PortPage.Values[4]) = '5432') then PortPage.Values[4] := '3306';
    if (not UseMariaDb()) and (Trim(PortPage.Values[4]) = '3306') then PortPage.Values[4] := '5432';
  end
  else if CurPageID = EsiPage.ID then
  begin
    if (Trim(EsiPage.Values[0]) = '') <> (Trim(EsiPage.Values[1]) = '') then
    begin
      MsgBox('Enter both the Client ID and the Secret Key, or leave both empty to add them later.', mbError, MB_OK);
      Result := False;
      Exit;
    end;
    WizardForm.NextButton.Enabled := False;
    try
      if not CheckAnswers(Problems) then
      begin
        MsgBox('Please fix these before installing:' + #13#10#13#10 + Problems, mbError, MB_OK);
        Result := False;
      end;
    finally
      WizardForm.NextButton.Enabled := True;
    end;
  end;
end;

function UpdateReadyMemo(Space, NewLine, MemoUserInfoInfo, MemoDirInfo, MemoTypeInfo, MemoComponentsInfo, MemoGroupInfo, MemoTasksInfo: String): String;
var
  Ports: String;
begin
  if Upgrading then
  begin
    Result := 'Upgrade EvE Conduit ' + InstalledVersion + ' to {#AppVersion}' + NewLine + Space + InstalledRoot + NewLine + NewLine +
      'A backup of the database and settings is made first.';
    Exit;
  end;
  Ports := 'HTTP ' + Trim(PortPage.Values[0]);
  if not NoTls() then Ports := Ports + ', HTTPS ' + Trim(PortPage.Values[1]);
  Ports := Ports + ', app ' + Trim(PortPage.Values[2]) + ', cache ' + Trim(PortPage.Values[3]) + ', database ' + Trim(PortPage.Values[4]);
  Result := 'Install folder:' + NewLine + Space + WizardDirValue() + NewLine + NewLine +
    'Site:' + NewLine + Space + ComputeSiteUrl() + NewLine + NewLine +
    'Database:' + NewLine + Space;
  if UseMariaDb() then Result := Result + 'MariaDB' else Result := Result + 'PostgreSQL';
  Result := Result + ' (inside the install folder)' + NewLine + NewLine + 'Ports:' + NewLine + Space + Ports + NewLine + NewLine + 'EVE application:' + NewLine + Space;
  if Trim(EsiPage.Values[0]) <> '' then Result := Result + 'Client ID ' + Trim(EsiPage.Values[0]) else Result := Result + 'add later in config\conduit.env';
end;

{ --- running the install ---------------------------------------------------------------------- }

{ Called for every line install.ps1 prints: keep it in the log, keep the last few for an error
  message, and show progress. Step lines look like "==> [3/14] Installing Python ...   (1:05)". }
procedure OnInstallLog(const S: String; const Error, FirstLine: Boolean);
var
  OpenAt, SlashAt, CloseAt, Step, Total: Integer;
begin
  SaveStringToFile(LogPath, S + #13#10, True);
  if Trim(S) = '' then Exit;
  Tail.Add(S);
  if Tail.Count > TailSize then Tail.Delete(0);
  if WizardSilent() then Exit;
  if Pos('==> ', S) = 1 then
  begin
    ProgressPage.SetText(Copy(S, 5, Length(S)), '');
    OpenAt := Pos('[', S);
    SlashAt := Pos('/', S);
    CloseAt := Pos(']', S);
    if (OpenAt > 0) and (SlashAt > OpenAt) and (CloseAt > SlashAt) then
    begin
      Step := StrToIntDef(Copy(S, OpenAt + 1, SlashAt - OpenAt - 1), 0);
      Total := StrToIntDef(Copy(S, SlashAt + 1, CloseAt - SlashAt - 1), 0);
      if (Total > 0) and (Step > 0) then
      begin
        ProgressPage.ProgressBar.Style := npbstNormal;
        ProgressPage.SetProgress(Step - 1, Total);
      end;
    end;
  end
  else
    ProgressPage.SetText(ProgressPage.Msg1Label.Caption, Trim(S));
end;

{ Keeps the log: in the install folder's logs when it exists, otherwise in %TEMP%. }
function KeepLog(): String;
var
  Root: String;
begin
  if Upgrading then Root := InstalledRoot else Root := WizardDirValue();
  if DirExists(Root + '\logs') then
    Result := Root + '\logs\installer.log'
  else
    Result := ExpandConstant('{%TEMP}\EvE-Conduit-installer.log');
  if not FileCopy(LogPath, Result, False) then
    Result := LogPath;
end;

procedure ReadResult();
var
  Lines: TArrayOfString;
  I, At: Integer;
  Key, Value: String;
begin
  if not LoadStringsFromFile(ResultPath(), Lines) then Exit;
  for I := 0 to GetArrayLength(Lines) - 1 do
  begin
    At := Pos('=', Lines[I]);
    if At > 1 then
    begin
      Key := Copy(Lines[I], 1, At - 1);
      Value := Trim(Copy(Lines[I], At + 1, Length(Lines[I])));
      if Key = 'SiteUrl' then ResultSiteUrl := Value
      else if Key = 'SetupCode' then ResultSetupCode := Value
      else if Key = 'Version' then ResultVersion := Value;
    end;
  end;
end;

function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  Code: Integer;
  Mode: String;
  Ran: Boolean;
begin
  Result := '';
  ExtractTemporaryFile('{#ZipName}');
  LogPath := ExpandConstant('{tmp}\installer.log');
  SaveStringToFile(LogPath, 'EvE Conduit {#AppVersion} setup log' + #13#10, False);
  if Upgrading then Mode := 'Upgrade' else Mode := 'Install';
  SaveStringToFile(ValuesPath(), ValuesText(True), False);
  Tail.Clear;
  if not WizardSilent() then
  begin
    ProgressPage.SetText('Starting...', '');
    ProgressPage.ProgressBar.Style := npbstMarquee;
    ProgressPage.Show;
  end;
  try
    Ran := ExecAndLogOutput(PowerShellExe(), ScriptArgs(Mode), ExpandConstant('{tmp}'), SW_HIDE, ewWaitUntilTerminated, Code, @OnInstallLog);
  finally
    if not WizardSilent() then ProgressPage.Hide;
    DeleteFile(ValuesPath());
  end;
  KeptLogPath := KeepLog();
  if Ran and (Code = 0) then
  begin
    ReadResult();
    if ResultVersion = '' then ResultVersion := '{#AppVersion}';
  end
  else
  begin
    if not Ran then
      Result := 'Setup could not start PowerShell: ' + SysErrorMessage(Code)
    else
      Result := 'The ' + Lowercase(Mode) + ' failed (exit code ' + IntToStr(Code) + '). Last lines:' + #13#10#13#10 + Tail.Text;
    Result := Result + #13#10 + 'Full log: ' + KeptLogPath;
  end;
end;

procedure DeinitializeSetup();
begin
  if Tail <> nil then Tail.Free;
end;
