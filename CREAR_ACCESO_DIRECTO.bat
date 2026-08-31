@echo off
:: ============================================================
:: Crea un acceso directo en el Escritorio para abrir la app
:: 100% en segundo plano sin ventana negra de CMD
:: ============================================================
TITLE Crear Acceso Directo - OLED Designer
cd /d "%~dp0"

echo.
echo Creando acceso directo en tu Escritorio...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $desktop = [Environment]::GetFolderPath('Desktop'); $shortcut = $ws.CreateShortcut((Join-Path $desktop 'OLED Designer Suite.lnk')); $shortcut.TargetPath = 'wscript.exe'; $shortcut.Arguments = '\"%~dp0INICIAR_OCULTO.vbs\"'; $shortcut.WorkingDirectory = '%~dp0'; $shortcut.Description = 'OLED-Designer-Suite-Professional'; $shortcut.Save()"

echo [OK] Acceso directo 'OLED Designer Suite' creado con exito en el Escritorio!
echo Ya puedes iniciar la aplicacion con doble clic desde tu escritorio sin ventana CMD.
echo.
exit /b 0
