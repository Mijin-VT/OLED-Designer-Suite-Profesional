@echo off
:: ============================================================
:: OLED Designer — Instalador Completo para Windows
:: INSTALL.bat
:: ============================================================
TITLE OLED Designer — Instalador
color 0A

echo.
echo  ======================================================
echo     OLED DESIGNER — Instalador de Entorno
echo  ======================================================
echo.
echo  Este instalador configurara:
echo   - Verificacion de entorno Node.js
echo   - Instalacion de paquetes npm (Electron, pg, etc.)
echo   - Creacion de acceso directo en el Escritorio
echo.
echo  Presiona cualquier tecla para comenzar...
pause >nul

cd /d "%~dp0"

:: ---- PASO 1: VERIFICAR NODE.JS ----
echo.
echo [1/3] Verificando instalacion de Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [!] Node.js no esta instalado en este equipo.
    echo      Descarga e instala la version LTS recomendada (18+):
    echo      https://nodejs.org/
    echo.
    set /p OPEN_URL="Deseas abrir la pagina de descarga ahora? [S/N]: "
    if /i "%OPEN_URL%"=="S" (
        start https://nodejs.org/
    )
    echo.
    echo Cuando termines de instalar Node.js, ejecuta este instalador nuevamente.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODE_VERSION=%%v
for /f "tokens=*" %%v in ('npm --version') do set NPM_VERSION=%%v
echo  [OK] Node.js %NODE_VERSION% detectado.
echo  [OK] npm v%NPM_VERSION% detectado.

:: ---- PASO 2: INSTALAR DEPENDENCIAS NPM ----
echo.
echo [2/3] Instalando dependencias de la aplicacion (npm install)...
echo       Esto puede tardar uno o dos minutos segun la velocidad de conexion...
echo.

call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Ocurrio un problema al instalar los paquetes de npm.
    echo Por favor verifica tu conexion a internet e intenta de nuevo.
    pause
    exit /b 1
)

:: Verificar que el binario de Electron este presente
if not exist "node_modules\electron\dist\electron.exe" (
    echo [INFO] Configurando binario de Electron...
    call node node_modules/electron/install.js >nul 2>&1
)

echo.
echo  [OK] Dependencias instaladas correctamente.

:: ---- PASO 3: CREAR ACCESO DIRECTO ----
echo.
echo [3/3] Creando acceso directo en el Escritorio...

set SHORTCUT_PATH=%USERPROFILE%\Desktop\OLED Designer.lnk
set TARGET_BAT=%~dp0INICIAR.bat
set ICON_PATH=%~dp0assets\icons\icon.ico

powershell -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell;" ^
  "$s = $ws.CreateShortcut('%SHORTCUT_PATH%');" ^
  "$s.TargetPath = '%TARGET_BAT%';" ^
  "$s.WorkingDirectory = '%~dp0';" ^
  "$s.Description = 'OLED Designer - Editor visual de interfaces OLED';" ^
  "if (Test-Path '%ICON_PATH%') { $s.IconLocation = '%ICON_PATH%' };" ^
  "$s.Save();" >nul 2>&1

if exist "%SHORTCUT_PATH%" (
    echo  [OK] Acceso directo 'OLED Designer' creado en tu Escritorio.
) else (
    echo  [!] No se pudo crear el acceso directo en el Escritorio (puedes ejecutar INICIAR.bat).
)

:: ---- FINALIZACION ----
echo.
echo  ======================================================
echo     Instalacion completada con exito!
echo  ======================================================
echo.
echo  Para abrir OLED Designer puedes:
echo    - Hacer doble clic en el acceso directo de tu Escritorio
echo    - O ejecutar INICIAR.bat en esta carpeta
echo.

set /p LAUNCH="Deseas iniciar OLED Designer ahora mismo? [S/N]: "
if /i "%LAUNCH%"=="S" (
    echo Iniciando...
    start "" "%~dp0INICIAR.bat"
)

exit /b 0
