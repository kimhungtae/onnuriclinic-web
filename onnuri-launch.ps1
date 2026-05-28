# Onnuri Sasang - launcher.
# Ensures the local server (port 8000) is running, then opens the app.
# The desktop shortcut "온누리 사상체질" points to this script.
$ErrorActionPreference = 'SilentlyContinue'
$here = Split-Path -Parent $PSCommandPath
$port = 8000

function Test-Port($p) {
  $c = New-Object Net.Sockets.TcpClient
  try { $c.Connect('127.0.0.1', $p); return $c.Connected }
  catch { return $false }
  finally { $c.Close() }
}

# Start the server if it is not already running.
if (-not (Test-Port $port)) {
  Start-Process -FilePath 'node' -ArgumentList 'server.js' `
    -WorkingDirectory $here -WindowStyle Minimized
  for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Milliseconds 400
    if (Test-Port $port) { break }
  }
}

# Find a browser (Chrome preferred, then Edge).
$cands = @(
  (Join-Path $env:ProgramFiles        'Google\Chrome\Application\chrome.exe'),
  (Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe'),
  (Join-Path $env:LocalAppData        'Google\Chrome\Application\chrome.exe'),
  (Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe'),
  (Join-Path $env:ProgramFiles        'Microsoft\Edge\Application\msedge.exe')
)
$browser = $cands | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

$url = "http://localhost:$port"
if ($browser) {
  Start-Process -FilePath $browser -ArgumentList ('--app={0} --start-maximized' -f $url)
} else {
  Start-Process $url
}
