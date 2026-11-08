setlocal enabledelayedexpansion

set /p version=Enter the version number:

set target[0]=vanilla
set target[1]=vanilla_mys
set target[2]=b3s
set target[3]=b3s_mys
set target[4]=b3s_hikfem
set target[5]=b3s_hikfem_mys
set target[6]=goosefem
set target[7]=goosefem_mys
set target[8]=goosemasc
set target[9]=goosemasc_mys
set target[10]=mikili
set target[11]=mikili_mys
set target[12]=au
set target[13]=au_mys
set target[14]=aumasc
set target[15]=aumasc_mys
set target[16]=rotting
set target[17]=rotting_mys

set imagepack[0]=vanilla
set imagepack[1]=vanilla_mys
set imagepack[2]=b3s
set imagepack[3]=b3s_mys
set imagepack[4]=b3s_hikfem
set imagepack[5]=b3s_hikfem_mys
set imagepack[6]=goosefem
set imagepack[7]=goosefem_mys
set imagepack[8]=goosemasc
set imagepack[9]=goosemasc_mys
set imagepack[10]=mikili
set imagepack[11]=mikili_mys
set imagepack[12]=au
set imagepack[13]=au_mys
set imagepack[14]=aumasc
set imagepack[15]=aumasc_mys
set imagepack[16]=rotting
set imagepack[17]=rotting_mys

set array_length=17

del ..\..\dist\*.apk

cd ..\..\

for /L %%i in (0,1,%array_length%) do (
	powershell -Command "(Get-Content -Path '.\version') -replace 'DoLP version', 'DoLP v0.%version% !imagepack[%%i]!' | Set-Content -Path '.\version'"

	powershell -Command "(Get-Content -Path '.\devTools\apkbuilder\config.xml') -replace 'DoLP version', 'DoLP v0.%version% !imagepack[%%i]!' | Set-Content -Path '.\devTools\apkbuilder\config.xml'"

	powershell -Command "(Get-Content -Path '.\devTools\apkbuilder\config.xml') -replace 'dolp_version', 'dolp_!imagepack[%%i]!' | Set-Content -Path '.\devTools\apkbuilder\config.xml'"

	powershell -Command "(Get-Content -Path '.\devTools\apkbuilder\config.xml') -replace 'DoLP short version', 'DoLP !imagepack[%%i]!' | Set-Content -Path '.\devTools\apkbuilder\config.xml'"

	@REM powershell -Command "(Get-Content -Path '.\devTools\apkbuilder\platforms\android\app\src\main\AndroidManifest.xml') -replace 'DoLP version', 'DoLP v0.%version% !imagepack[%%i]!' | Set-Content -Path '.\devTools\apkbuilder\platforms\android\app\src\main\AndroidManifest.xml'"

	@REM powershell -Command "(Get-Content -Path '.\devTools\apkbuilder\platforms\android\app\src\main\assets\www\index.html') -replace 'DoLP version', 'DoLP v0.%version% !imagepack[%%i]!' | Set-Content -Path '.\devTools\apkbuilder\platforms\android\app\src\main\assets\www\index.html'"

	@REM powershell -Command "(Get-Content -Path '.\devTools\apkbuilder\platforms\android\app\src\main\res\xml\config.xml') -replace 'DoLP version', 'DoLP v0.%version% !imagepack[%%i]!' | Set-Content -Path '.\devTools\apkbuilder\platforms\android\app\src\main\res\xml\config.xml'"

	powershell -Command "(Get-Content -Path '.\game\01-config\sugarcubeConfig.js') -replace 'DoLP version', 'DoLP v0.%version% !imagepack[%%i]!' | Set-Content -Path '.\game\01-config\sugarcubeConfig.js'"

	cd .\devTools\apkbuilder\imagepack_builds\

	call "!target[%%i]!.bat"

	cd ..\..\..\

	call compile.bat

	cd .\devTools\apkbuilder\

	call .\build_app_debug.bat

	cd .\imagepack_builds\

	call .\reset.bat

	cd ..\..\..\

	git reset --hard

	del "Degrees of Lewdity.html"

	cd .\dist\

	ren "DoLP-v0.%version%-!imagepack[%%i]!-0.5.12.8-debug.apk" "DoLP v0.%version% !imagepack[%%i]! 0.5.12.8.apk"

	cd ..\
)

endlocal
