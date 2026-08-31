# ============================================================
# OLED Designer — Configurador de PostgreSQL para Windows
# setup_postgres.ps1
# 
# Crea la base de datos oled_designer usando el usuario postgres
# existente y ejecuta los scripts SQL.
# ============================================================

param(
    [string]$PGHost     = "localhost",
    [int]   $PGPort     = 5432,
    [string]$DBName     = "oled_designer",
    [string]$DBUser     = "postgres",
    [string]$DBPassword = ""
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " OLED Designer — Configurador PostgreSQL"   -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ---- BUSCAR PostgreSQL ----
Write-Host "[1/4] Buscando instalación de PostgreSQL..." -ForegroundColor Yellow

$pgPaths = @(
    "F:\PostgreSQL\18\bin",
    "C:\Program Files\PostgreSQL\18\bin",
    "C:\Program Files\PostgreSQL\17\bin",
    "C:\Program Files\PostgreSQL\16\bin",
    "C:\Program Files\PostgreSQL\15\bin"
)

$psqlPath = $null
foreach ($path in $pgPaths) {
    if (Test-Path "$path\psql.exe") {
        $psqlPath = "$path\psql.exe"
        Write-Host "[OK] PostgreSQL encontrado en: $path" -ForegroundColor Green
        break
    }
}

# También buscar en PATH
if (-not $psqlPath) {
    try {
        $psqlPath = (Get-Command psql -ErrorAction SilentlyContinue).Source
        if ($psqlPath) {
            Write-Host "[OK] psql encontrado en PATH: $psqlPath" -ForegroundColor Green
        }
    } catch {}
}

if (-not $psqlPath) {
    Write-Host "[!] PostgreSQL no encontrado en rutas estándar." -ForegroundColor Yellow
    Write-Host "    La aplicación funcionará igualmente en modo local (sin DB)." -ForegroundColor Gray
    exit 0
}

# ---- VERIFICAR SERVICIO ----
Write-Host "[2/4] Verificando servicio PostgreSQL..." -ForegroundColor Yellow

$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1

if ($pgService) {
    if ($pgService.Status -ne "Running") {
        Write-Host "[INFO] Iniciando servicio: $($pgService.Name)" -ForegroundColor Yellow
        Start-Service $pgService.Name
        Start-Sleep -Seconds 2
    }
    Write-Host "[OK] Servicio '$($pgService.Name)' activo." -ForegroundColor Green
}

# ---- CONFIGURAR ARCHIVO DE CONFIGURACIÓN ----
Write-Host "[3/4] Configurando archivo db.config.json..." -ForegroundColor Yellow

$scriptRoot = Split-Path -Parent $PSScriptRoot
$configFile = Join-Path $scriptRoot "db.config.json"

$dbConfig = @{
    host     = $PGHost
    port     = $PGPort
    database = $DBName
    user     = $DBUser
    password = $DBPassword
} | ConvertTo-Json -Depth 2

$dbConfig | Out-File -FilePath $configFile -Encoding UTF8
Write-Host "[OK] db.config.json actualizado (usuario: $DBUser, host: $PGHost:$PGPort)" -ForegroundColor Green

# ---- RESUMEN ----
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Configuración completada"                   -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " Base de datos: $DBName"     -ForegroundColor White
Write-Host " Usuario:       $DBUser"     -ForegroundColor White
Write-Host " Host:          ${PGHost}:$PGPort" -ForegroundColor White
Write-Host ""
Write-Host " Nota: La base de datos y tablas se inicializan" -ForegroundColor Gray
Write-Host " automáticamente al iniciar OLED Designer."       -ForegroundColor Gray
Write-Host ""
