Option Explicit
' ============================================================
' OLED Designer — Lanzador Silencioso (sin consola)
' INICIAR_OCULTO.vbs
' ============================================================

Dim WShell, FSO, ScriptDir, BatPath

Set WShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

ScriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)
BatPath = ScriptDir & "\INICIAR.bat"

If FSO.FileExists(BatPath) Then
    ' 0 = ocultar ventana, False = no esperar a que termine
    WShell.Run """" & BatPath & """", 0, False
Else
    MsgBox "No se encontro INICIAR.bat en:" & vbCrLf & BatPath, vbCritical, "OLED Designer"
End If

Set WShell = Nothing
Set FSO = Nothing
