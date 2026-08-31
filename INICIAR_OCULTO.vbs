Option Explicit
' ============================================================
' OLED Designer — Lanzador Silencioso (sin consola)
' INICIAR_OCULTO.vbs
' ============================================================

Dim WShell, FSO, ScriptDir, ElectronExe, BatPath

Set WShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

ScriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)
ElectronExe = ScriptDir & "\node_modules\electron\dist\electron.exe"
BatPath = ScriptDir & "\INICIAR.bat"

If FSO.FileExists(ElectronExe) Then
    ' Lanzar Electron directamente sin consola ni ventanas intermedias
    WShell.Run """" & ElectronExe & """ """ & ScriptDir & """", 0, False
ElseIf FSO.FileExists(BatPath) Then
    ' Si no existe Electron, ejecutar INICIAR.bat en segundo plano silencioso
    WShell.Run "cmd.exe /c """"" & BatPath & """""", 0, False
Else
    MsgBox "No se encontro el ejecutable de la aplicacion en:" & vbCrLf & ScriptDir, vbCritical, "OLED Designer"
End If

Set WShell = Nothing
Set FSO = Nothing
