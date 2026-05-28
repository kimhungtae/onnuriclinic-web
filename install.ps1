# 온누리 사상체질 진료 시스템 — 최초 설치 (방화벽 허용 + 서버 자동시작)
# 설치_처음에한번.bat 이 이 스크립트를 실행합니다.
$ErrorActionPreference = 'Continue'
try { chcp 65001 > $null } catch {}
$here = Split-Path -Parent $PSCommandPath

# ── 관리자 권한 확인 → 없으면 자기 자신을 관리자로 재실행 ──
$id = [Security.Principal.WindowsIdentity]::GetCurrent()
$pr = New-Object Security.Principal.WindowsPrincipal($id)
if (-not $pr.IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)) {
  Write-Host '관리자 권한을 요청합니다. 권한 창에서 [예]를 눌러주세요...'
  Start-Process powershell -Verb RunAs -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File "{0}"' -f $PSCommandPath)
  exit
}

Write-Host ''
Write-Host '==========================================='
Write-Host '  온누리 사상체질 진료 시스템 — 최초 설치'
Write-Host '==========================================='
Write-Host ''
Write-Host '이 작업은 처음 한 번만 하면 됩니다.'
Write-Host ''

# ── 1) 방화벽 — 포트 8000 인바운드 허용 ──
Write-Host '[1/2] 방화벽에 접속 포트(8000)를 허용합니다...'
try {
  Get-NetFirewallRule -DisplayName 'Onnuri Sasang Clinic 8000' -ErrorAction SilentlyContinue |
    Remove-NetFirewallRule -ErrorAction SilentlyContinue
  New-NetFirewallRule -DisplayName 'Onnuri Sasang Clinic 8000' -Direction Inbound `
    -Action Allow -Protocol TCP -LocalPort 8000 -Profile Any | Out-Null
  Write-Host '      완료'
} catch {
  Write-Host ('      실패 — ' + $_.Exception.Message)
}
Write-Host ''

# ── 2) 시작프로그램 — 서버 자동 실행 등록 ──
Write-Host '[2/2] 컴퓨터를 켤 때 서버가 자동 실행되도록 등록합니다...'
try {
  $lnk = Join-Path ([Environment]::GetFolderPath('Startup')) '온누리 사상체질 서버.lnk'
  $ws  = New-Object -ComObject WScript.Shell
  $s   = $ws.CreateShortcut($lnk)
  $s.TargetPath       = (Join-Path $here '서버시작.bat')
  $s.WorkingDirectory = $here
  $s.WindowStyle      = 7
  $s.Description      = '온누리 사상체질 진료 서버'
  $s.Save()
  Write-Host '      완료'
} catch {
  Write-Host ('      실패 — ' + $_.Exception.Message)
}
Write-Host ''
Write-Host '==========================================='
Write-Host '  설치가 끝났습니다.'
Write-Host '==========================================='
Write-Host ''
Write-Host '  - 지금 서버를 켜려면 "서버시작.bat" 을 더블클릭하세요.'
Write-Host '  - 다음에 컴퓨터를 켜면 서버가 자동으로 실행됩니다.'
Write-Host '  - 접수실 PC 접속 주소는 "접속주소_안내.txt" 에서 확인하세요.'
Write-Host ''
Read-Host '엔터 키를 누르면 창이 닫힙니다'
