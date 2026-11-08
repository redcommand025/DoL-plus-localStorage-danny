setlocal enabledelayedexpansion

set /p version=Enter the version number:

del ..\..\dist\*.apk

cd ..\..\

powershell -Command "(Get-Content -Path '.\version') -replace 'DoLP version', 'DoLP v0.%version%' | Set-Content -Path '.\version'"

powershell -Command "(Get-Content -Path '.\devTools\apkbuilder\config.xml') -replace 'DoLP version', 'DoLP v0.%version%' | Set-Content -Path '.\devTools\apkbuilder\config.xml'"

powershell -Command "(Get-Content -Path '.\devTools\apkbuilder\config.xml') -replace 'dolp_version', 'dolp' | Set-Content -Path '.\devTools\apkbuilder\config.xml'"

powershell -Command "(Get-Content -Path '.\devTools\apkbuilder\config.xml') -replace 'DoLP short version', 'DoLP' | Set-Content -Path '.\devTools\apkbuilder\config.xml'"

@REM powershell -Command "(Get-Content -Path '.\devTools\apkbuilder\platforms\android\app\src\main\AndroidManifest.xml') -replace 'DoLP version', 'DoLP v0.%version% %imagepack%' | Set-Content -Path '.\devTools\apkbuilder\platforms\android\app\src\main\AndroidManifest.xml'"

@REM powershell -Command "(Get-Content -Path '.\devTools\apkbuilder\platforms\android\app\src\main\assets\www\index.html') -replace 'DoLP version', 'DoLP v0.%version% %imagepack%' | Set-Content -Path '.\devTools\apkbuilder\platforms\android\app\src\main\assets\www\index.html'"

@REM powershell -Command "(Get-Content -Path '.\devTools\apkbuilder\platforms\android\app\src\main\res\xml\config.xml') -replace 'DoLP version', 'DoLP v0.%version% %imagepack%' | Set-Content -Path '.\devTools\apkbuilder\platforms\android\app\src\main\res\xml\config.xml'"

powershell -Command "(Get-Content -Path '.\game\01-config\sugarcubeConfig.js') -replace 'DoLP version', 'DoLP v0.%version%' | Set-Content -Path '.\game\01-config\sugarcubeConfig.js'"

call compile.bat

cd .\devTools\apkbuilder\

call .\build_app_debug.bat

cd ..\..\

git reset --hard

del "Degrees of Lewdity.html"

cd .\dist\

ren "DoLP-v0.%version%-0.5.11.9 DoLP v0.%version%-debug.apk" "DoLP v0.%version% 0.5.11.9.apk"

cd ..\

endlocal
