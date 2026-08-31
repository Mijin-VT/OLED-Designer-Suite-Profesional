@echo off
:: ============================================================
:: OLED Designer — Lanzador Principal Windows
:: INICIAR.bat
:: ============================================================
TITLE OLED Designer
color 0B

echo.
echo  ======================================================
echo     OLED DESIGNER — Editor Visual de Pantallas OLED
echo  ======================================================
echo.

cd /d "%~dp0"

:: 1. Verificar si Node.js está disponible
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] No se encontro Node.js en el sistema.
    echo Por favor instala Node.js LTS desde https://nodejs.org/
    echo o ejecuta primero INSTALL.bat
    echo.
    pause
    exit /b 1
)

:: 2. Verificar dependencias de Node.js
if not exist "node_modules\" (
    echo [INFO] Las dependencias no estan instaladas.
    echo Ejecutando instalacion automatica...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] No se pudieron instalar las dependencias de npm.
        pause
        exit /b 1
    )
)

:: 3. Verificar ejecutable de Electron
if not exist "node_modules\electron\dist\electron.exe" (
    echo [INFO] Configurando binario de Electron...
    node -e "const { download } = require('@electron/get'); download('28.2.0').then(p => console.log('Downloaded:', p)).catch(e => console.error(e.message));" >nul 2>&1
    call npm install electron --save-dev >nul 2>&1
)

:: 4. Lanzar la aplicacion directamente en segundo plano (sin dejar ventana CMD)
echo [OK] Iniciando OLED Designer...

if exist "%~dp0node_modules\electron\dist\electron.exe" (
    start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0."
) else (
    start "" npm start
)

exit
