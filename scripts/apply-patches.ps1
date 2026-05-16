$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot

function Add-LineAfter {
  param(
    [string]$Path,
    [string]$Anchor,
    [string]$Line
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }

  $content = Get-Content -LiteralPath $Path -Raw
  if ($content.Contains($Line.Trim())) {
    return
  }

  $content = $content.Replace($Anchor, "$Anchor`r`n$Line")
  Set-Content -LiteralPath $Path -Value $content -NoNewline
}

$visionCameraCmake = Join-Path $root 'node_modules/react-native-vision-camera/android/CMakeLists.txt'
Add-LineAfter `
  -Path $visionCameraCmake `
  -Anchor '        ${LOG_LIB}                          # <-- Logcat logger' `
  -Line '        c++_shared                          # <-- Android C++ runtime'

$rnApplicationCmake = Join-Path $root 'node_modules/react-native/ReactAndroid/cmake-utils/ReactNative-application.cmake'
Add-LineAfter `
  -Path $rnApplicationCmake `
  -Anchor 'target_link_libraries(${CMAKE_PROJECT_NAME}' `
  -Line '        c++_shared'
Add-LineAfter `
  -Path $rnApplicationCmake `
  -Anchor '            target_link_libraries(${autolinked_library} common_flags)' `
  -Line '            target_link_libraries(${autolinked_library} c++_shared)'
