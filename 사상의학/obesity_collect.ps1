# Obesity File Collection v6 (ASCII-only script + external UTF-8 config)
# Reads obesity_config.txt for paths and keywords (Korean content there).
# Usage:
#   powershell -ExecutionPolicy Bypass -File obesity_collect.ps1 -Mode Preview
#   powershell -ExecutionPolicy Bypass -File obesity_collect.ps1 -Mode Execute

param(
    [ValidateSet("Preview","Execute")]
    [string]$Mode = "Preview"
)

try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    chcp 65001 > $null
} catch {}

$configPath = Join-Path $PSScriptRoot "obesity_config.txt"
$LOG = Join-Path $PSScriptRoot "obesity_log.txt"

function Log([string]$msg, [string]$color = "White") {
    $line = "$(Get-Date -Format 'HH:mm:ss')  $msg"
    Write-Host $line -ForegroundColor $color
    try { Add-Content -Path $LOG -Value $line -Encoding UTF8 } catch {}
}

# Initialize log
try {
    "=== Obesity collection start $(Get-Date) ===" | Out-File -FilePath $LOG -Encoding UTF8 -Force
    "Mode: $Mode" | Add-Content -Path $LOG -Encoding UTF8
    "PowerShell version: $($PSVersionTable.PSVersion)" | Add-Content -Path $LOG -Encoding UTF8
    "Script path: $PSScriptRoot" | Add-Content -Path $LOG -Encoding UTF8
} catch {}

try {
    Log "===== Obesity Collection Start =====" Cyan

    # Load config (UTF-8 explicit)
    Log "[0] Loading config: $configPath" Green
    if (-not (Test-Path $configPath)) {
        Log "  X Config file not found" Red
        throw "Config file missing: $configPath"
    }

    $SRC = $null
    $DST = $null
    $KEYWORDS = @()
    $section = $null
    Get-Content -Path $configPath -Encoding UTF8 | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq "" -or $line.StartsWith("#")) { return }
        if ($line -match "^\[(.+)\]$") {
            $section = $matches[1].ToLower()
            return
        }
        if ($section -eq "keywords") {
            $KEYWORDS += $line
        } elseif ($line -match "^([^=]+)=(.+)$") {
            $key = $matches[1].Trim().ToLower()
            $val = $matches[2].Trim()
            if ($key -eq "source") { $SRC = $val }
            elseif ($key -eq "destination") { $DST = $val }
        }
    }

    if (-not $SRC -or -not $DST -or $KEYWORDS.Count -eq 0) {
        Log "  X Config incomplete (source=$SRC, dst=$DST, keywords=$($KEYWORDS.Count))" Red
        throw "Config incomplete"
    }
    Log "  OK Source: $SRC" Green
    Log "  OK Destination: $DST" Green
    Log "  OK Keywords loaded: $($KEYWORDS.Count)" Green

    Log "Mode: $Mode" Yellow

    Log "[1] Checking F: drive..." Green
    if (-not (Test-Path "F:\")) {
        Log "  X F: drive not accessible" Red
        throw "F: drive not accessible"
    }
    Log "  OK F: drive accessible" Green

    Log "[2] Checking source folder..." Green
    if (-not (Test-Path $SRC)) {
        Log "  X Source folder not found: $SRC" Red
        Log "  F: top-level folders:" Yellow
        Get-ChildItem -Path "F:\" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
            Log "      F:\$($_.Name)" Gray
        }
        throw "Source folder not found"
    }
    Log "  OK Source folder exists" Green

    Log "[3] Preparing destination..." Green
    if (-not (Test-Path $DST)) {
        New-Item -ItemType Directory -Path $DST -Force | Out-Null
        Log "  OK Destination created: $DST" Green
    } else {
        Log "  OK Destination exists: $DST" Green
    }

    Log "[4] Searching by keywords (may take a minute)..." Green
    $files = @()
    $folders = @()
    foreach ($k in $KEYWORDS) {
        $pat = "*$k*"
        $f = Get-ChildItem -Path $SRC -Filter $pat -File -Recurse -Force -ErrorAction SilentlyContinue
        $d = Get-ChildItem -Path $SRC -Filter $pat -Directory -Recurse -Force -ErrorAction SilentlyContinue
        if ($f) {
            $files += $f
            Log ("  Files matching '{0}': {1}" -f $k, $f.Count) Gray
        }
        if ($d) {
            $folders += $d
            Log ("  Folders matching '{0}': {1}" -f $k, $d.Count) Gray
        }
    }
    $files = $files | Sort-Object FullName -Unique
    $folders = $folders | Sort-Object FullName -Unique

    foreach ($fd in $folders) {
        $files += Get-ChildItem -Path $fd.FullName -File -Recurse -Force -ErrorAction SilentlyContinue
    }
    $files = $files | Sort-Object FullName -Unique
    Log ("  Total matched files: {0}" -f $files.Count) Cyan

    if ($files.Count -eq 0) {
        Log "  No matching files. End." Yellow
        throw "No files matched"
    }

    Log "[5] Identifying duplicates by SHA-256..." Green
    $uniqueByHash = @{}
    $dupFiles = @()
    $idx = 0
    foreach ($f in $files) {
        $idx++
        if ($idx % 100 -eq 0) { Log ("  Hashing... {0}/{1}" -f $idx, $files.Count) Gray }
        try {
            if ($f.Length -gt 100MB) {
                $key = "size_$($f.Length)_$($f.Name)"
            } else {
                $h = (Get-FileHash -Path $f.FullName -Algorithm SHA256 -ErrorAction SilentlyContinue).Hash
                if (-not $h) { continue }
                $key = $h
            }
            if ($uniqueByHash.ContainsKey($key)) { $dupFiles += $f }
            else { $uniqueByHash[$key] = $f }
        } catch {
            Log ("  Hash error: {0}" -f $f.Name) Yellow
        }
    }
    $uniqueFiles = $uniqueByHash.Values
    Log ("  Unique: {0} / Duplicates: {1}" -f $uniqueFiles.Count, $dupFiles.Count) Cyan

    Log "[6] Executing $Mode..." Green
    $done = 0; $failed = 0; $totalSize = 0
    $srcRoot = (Resolve-Path $SRC).Path.TrimEnd('\')

    $previewListPath = Join-Path $DST "_preview_list.txt"
    if ($Mode -eq "Preview") {
        "=== Files that will be moved ($(Get-Date)) ===" | Out-File -FilePath $previewListPath -Encoding UTF8 -Force
    }

    foreach ($f in $uniqueFiles) {
        try {
            $rel = $f.FullName.Substring($srcRoot.Length + 1)
            $dstPath = Join-Path $DST $rel
            $dstDir = Split-Path $dstPath -Parent

            if ($Mode -eq "Execute") {
                if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
                Move-Item -Path $f.FullName -Destination $dstPath -Force -ErrorAction Stop
                $done++
                $totalSize += $f.Length
                if ($done % 50 -eq 0) { Log ("  Move progress: {0}/{1}" -f $done, $uniqueFiles.Count) Gray }
            } else {
                Add-Content -Path $previewListPath -Value ("{0}  =>  {1}" -f $f.FullName, $dstPath) -Encoding UTF8 -ErrorAction SilentlyContinue
                $done++
                $totalSize += $f.Length
            }
        } catch {
            $failed++
            Log ("  Failed: {0} - {1}" -f $f.Name, $_) Red
        }
    }

    $dupDeleted = 0
    if ($Mode -eq "Execute" -and $dupFiles.Count -gt 0) {
        Log ("[7] Deleting {0} duplicates..." -f $dupFiles.Count) Yellow
        foreach ($d in $dupFiles) {
            try {
                Remove-Item -Path $d.FullName -Force -ErrorAction Stop
                $dupDeleted++
            } catch {}
        }
        Log ("  Deleted {0} duplicates" -f $dupDeleted) Yellow
    }

    $totalMB = [math]::Round($totalSize / 1MB, 2)
    Log ""
    Log "===== COMPLETE =====" Cyan
    Log ("{0}: {1} processed, {2} MB, {3} failed" -f $Mode, $done, $totalMB, $failed) Green
    if ($Mode -eq "Execute") { Log ("Duplicates deleted: {0}" -f $dupDeleted) Yellow }

    if (Test-Path $DST) {
        $summary = "Obesity File Collection Result`r`n" +
                   "==============================`r`n" +
                   "Run time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`r`n" +
                   "Mode: $Mode`r`n" +
                   "Source: $SRC`r`n" +
                   "Destination: $DST`r`n" +
                   "`r`n" +
                   "Matched files: $($files.Count)`r`n" +
                   "Unique files: $($uniqueFiles.Count)`r`n" +
                   "Processed: $done`r`n" +
                   "Failed: $failed`r`n" +
                   "Duplicates removed: $dupDeleted`r`n" +
                   "Total size: $totalMB MB`r`n" +
                   "`r`n" +
                   "Detailed log: $LOG`r`n"
        $summary | Out-File -FilePath (Join-Path $DST "_summary.txt") -Encoding UTF8 -Force
    }

    if ($Mode -eq "Execute") {
        Start-Process explorer.exe -ArgumentList $DST
    } else {
        if (Test-Path $previewListPath) {
            Start-Process notepad.exe -ArgumentList $previewListPath
        }
    }

} catch {
    Log "" Red
    Log "===== ERROR =====" Red
    Log ("Error: {0}" -f $_) Red
    Log ("StackTrace: {0}" -f $_.ScriptStackTrace) Red
}

Log ""
Log ("Log file: {0}" -f $LOG) Cyan
Log "============================================" Cyan
Write-Host ""
Write-Host "[Press Enter to close]" -ForegroundColor Yellow
Read-Host
