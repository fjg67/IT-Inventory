$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$screensDir = Join-Path $root 'assets\screens'

if (-not (Test-Path $screensDir)) {
  New-Item -ItemType Directory -Path $screensDir | Out-Null
}

$device = (adb devices | Select-String 'emulator-\d+\s+device' | Select-Object -First 1)
if (-not $device) {
  Write-Host 'Aucun emulateur detecte. Lancez un emulateur Android puis reessayez.' -ForegroundColor Red
  exit 1
}

$shots = @(
  @{ file = '01_splash.png'; prompt = 'Ecran Splash / Loader' },
  @{ file = '02_onboarding_1.png'; prompt = 'Onboarding slide 1' },
  @{ file = '03_onboarding_2.png'; prompt = 'Onboarding slide 2' },
  @{ file = '04_onboarding_3.png'; prompt = 'Onboarding slide 3' },
  @{ file = '05_onboarding_4.png'; prompt = 'Onboarding slide 4' },
  @{ file = '06_login.png'; prompt = 'Ecran de connexion' },
  @{ file = '07_site_select.png'; prompt = 'Selection du site' },
  @{ file = '08_dashboard.png'; prompt = 'Dashboard principal' },
  @{ file = '09_articles_list.png'; prompt = 'Liste des articles' },
  @{ file = '10_article_detail.png'; prompt = 'Detail article' },
  @{ file = '11_article_condition.png'; prompt = 'Etat article bon/defectueux' },
  @{ file = '12_parc_pc.png'; prompt = 'Liste Parc PC' },
  @{ file = '13_pc_detail.png'; prompt = 'Detail PC' },
  @{ file = '14_pc_panne_modal.png'; prompt = 'Modal declaration panne' },
  @{ file = '15_pc_rename.png'; prompt = 'Modal renommage PC' },
  @{ file = '16_scanner.png'; prompt = 'Ecran scanner camera' },
  @{ file = '17_scan_result.png'; prompt = 'Resultat scan' },
  @{ file = '18_mouvement_flow.png'; prompt = 'Saisie mouvement' },
  @{ file = '19_mouvements_list.png'; prompt = 'Historique mouvements' },
  @{ file = '20_parametres.png'; prompt = 'Ecran parametres' },
  @{ file = '21_force_update.png'; prompt = 'Ecran mise a jour forcee' }
)

Write-Host ''
Write-Host 'Capture guidee demarree.' -ForegroundColor Green
Write-Host "Dossier de sortie: $screensDir"
Write-Host 'Pour chaque etape, placez le bon ecran sur l emulateur puis appuyez sur Entree.'
Write-Host 'Tapez skip pour ignorer une etape, ou q pour quitter.'
Write-Host ''

$index = 1
foreach ($shot in $shots) {
  Write-Host "[$index/$($shots.Count)] $($shot.prompt) -> $($shot.file)" -ForegroundColor Cyan
  $answer = Read-Host 'Entree=Capturer | skip=Ignorer | q=Quitter'

  if ($answer -eq 'q') {
    Write-Host 'Capture interrompue par utilisateur.' -ForegroundColor Yellow
    break
  }

  if ($answer -eq 'skip') {
    Write-Host 'Ignore.' -ForegroundColor DarkYellow
    $index++
    continue
  }

  $target = Join-Path $screensDir $shot.file
  $remote = '/sdcard/it_inventory_capture.png'

  adb shell screencap -p $remote | Out-Null
  adb pull $remote $target | Out-Null
  adb shell rm $remote | Out-Null

  if (Test-Path $target) {
    $size = (Get-Item $target).Length
    if ($size -gt 0) {
      Write-Host "Capture enregistree: $($shot.file)" -ForegroundColor Green
    } else {
      Write-Host "Fichier vide: $($shot.file)" -ForegroundColor Red
    }
  } else {
    Write-Host "Echec capture: $($shot.file)" -ForegroundColor Red
  }

  $index++
}

Write-Host ''
Write-Host 'Resume des fichiers presentes:' -ForegroundColor Magenta
Get-ChildItem -Path $screensDir -Filter '*.png' | Sort-Object Name | Select-Object Name, Length | Format-Table -AutoSize
