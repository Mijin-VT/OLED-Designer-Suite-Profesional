Option Explicit
' ============================================================
' OLED Designer — Lanzador Silencioso (sin ventana de consola)
' INICIAR_OCULTO.vbs
' 
' Ejecuta INICIAR.bat de manera invisible.
' ============================================================

Dim WShell
Dim ScriptDir
Dim BatPath

Set WShell = CreateObject("WScript.Shell")

' Obtener directorio del script
ScriptDir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))

' Ruta al BAT (un nivel arriba del directorio scripts/)
BatPath = ScriptDir & "INICIAR.bat"

' Verificar que el BAT existe
Dim FSO
Set FSO = CreateObject("Scripting.FileSystemObject")

If Not FSO.FileExists(BatPath) Then
    ' Intentar desde el directorio padre
    BatPath = Left(ScriptDir, InStrRev(Left(ScriptDir, Len(ScriptDir)-1), "\")) & "INICIAR.bat"
End If

If Not FSO.FileExists(BatPath) Then
    MsgBox "No se encontró INICIAR.bat" & vbCrLf & "Buscado en: " & BatPath, vbCritical, "OLED Designer"
    WScript.Quit 1
End If

' Ejecutar de forma oculta (0 = oculto, False = no esperar)
WShell.Run """" & BatPath & """", 0, False

Set WShell = Nothing
Set FSO = Nothing
