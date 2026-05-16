param(
  [switch]$StartMetro,
  [switch]$RunAndroid
)

$ErrorActionPreference = 'Stop'

function Write-Info($message) {
  Write-Host "[fix-debug-metro] $message"
}

Write-Info "Checking ADB..."
adb start-server | Out-Null
adb wait-for-device | Out-Null

$deviceList = adb devices
if (-not ($deviceList -match "\sdevice$")) {
  throw "No Android device/emulator detected."
}

Write-Info "Applying adb reverse tcp:8081 -> tcp:8081"
adb reverse tcp:8081 tcp:8081 | Out-Null

$prefsContent = @"
<?xml version='1.0' encoding='utf-8' standalone='yes' ?>
<map>
  <string name="debug_http_host">localhost:8081</string>
</map>
"@

$tmpFile = Join-Path $env:TEMP "ReactNativeDevBundleDownloadPrefs.xml"
Set-Content -Path $tmpFile -Value $prefsContent -Encoding UTF8

Write-Info "Pushing React Native debug host preferences"
adb push $tmpFile /data/local/tmp/ReactNativeDevBundleDownloadPrefs.xml | Out-Null

try {
  adb shell run-as com.itinventory cp /data/local/tmp/ReactNativeDevBundleDownloadPrefs.xml shared_prefs/ReactNativeDevBundleDownloadPrefs.xml | Out-Null
  Write-Info "debug_http_host forced to localhost:8081"
} catch {
  Write-Warning "Unable to write app shared_prefs via run-as. Ensure debug app com.itinventory is installed."
}

if ($StartMetro) {
  Write-Info "Starting Metro with reset-cache in a new terminal window"
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "cd /d $PSScriptRoot\.. && npx react-native start --reset-cache"
}

if ($RunAndroid) {
  Write-Info "Restarting app and launching debug build"
  adb shell am force-stop com.itinventory | Out-Null
  npx react-native run-android --no-packager
}

Write-Info "Done."
