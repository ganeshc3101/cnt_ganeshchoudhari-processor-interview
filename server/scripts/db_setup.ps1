# ==============================================================
# db_setup.ps1 — Windows bootstrap for the Processor backend.
#
# Idempotent. Safe to re-run.
#   - Ensures the PostgreSQL Windows service is running.
#   - Creates role + database (skips if present).
#   - Runs every SQL file in .\sql\ in lexical order.
#   - Seeds master data, permissions, roles, and the admin user.
#
# Prerequisites:
#   - PostgreSQL installed (https://www.postgresql.org/download/windows/)
#   - psql.exe on PATH
#   - $env:PGPASSWORD set to the 'postgres' superuser password BEFORE running
#
# Override defaults via environment variables:
#   DB_NAME DB_USER DB_PASSWORD DB_HOST DB_PORT PG_SUPERUSER
# ==============================================================

#Requires -Version 5.1
$ErrorActionPreference = 'Stop'

function Get-OrDefault([string]$Name, [string]$Default) {
    $val = [Environment]::GetEnvironmentVariable($Name)
    if ([string]::IsNullOrEmpty($val)) { return $Default } else { return $val }
}

$DB_NAME        = Get-OrDefault 'DB_NAME'        'processor'
$DB_USER        = Get-OrDefault 'DB_USER'        'processor'
$DB_PASSWORD    = Get-OrDefault 'DB_PASSWORD'    'processor'
$DB_HOST        = Get-OrDefault 'DB_HOST'        'localhost'
$DB_PORT        = Get-OrDefault 'DB_PORT'        '5432'
$PG_SUPERUSER   = Get-OrDefault 'PG_SUPERUSER'   'postgres'
$PG_SUPER_PW    = Get-OrDefault 'PGPASSWORD'     ''

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SqlDir    = Join-Path  $ScriptDir 'sql'

function Log ([string]$Msg)  { Write-Host "[db-setup] $Msg" -ForegroundColor Cyan }
function Warn([string]$Msg)  { Write-Host "[db-setup] $Msg" -ForegroundColor Yellow }
function Die ([string]$Msg)  { Write-Host "[db-setup] $Msg" -ForegroundColor Red; exit 1 }

function Ensure-PostgresRunning {
    $svc = Get-Service | Where-Object { $_.Name -match '^postgresql' } | Select-Object -First 1
    if (-not $svc) {
        Die "No PostgreSQL service detected. Install from https://www.postgresql.org/download/windows/"
    }
    if ($svc.Status -ne 'Running') {
        Log "Starting service $($svc.Name)..."
        Start-Service -Name $svc.Name
    } else {
        Log "Service $($svc.Name) is already running."
    }
}

function Wait-ForPostgres {
    Log "Waiting for Postgres on ${DB_HOST}:${DB_PORT}..."
    for ($i = 0; $i -lt 30; $i++) {
        try {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $tcp.Connect($DB_HOST, [int]$DB_PORT)
            $tcp.Close()
            Log "Postgres is ready."
            return
        } catch {
            Start-Sleep -Seconds 1
        }
    }
    Die "Postgres did not become ready within 30 seconds."
}

function Invoke-Psql {
    param(
        [string]$User,
        [string]$Password,
        [string]$Db,
        [string[]]$ExtraArgs = @()
    )
    $env:PGPASSWORD = $Password
    $args = @('-h', $DB_HOST, '-p', $DB_PORT, '-U', $User, '-d', $Db, '-v', 'ON_ERROR_STOP=1') + $ExtraArgs
    & psql @args
    if ($LASTEXITCODE -ne 0) {
        Die "psql failed for user=$User db=$Db"
    }
}

function Admin-Psql-Capture {
    param([string]$Sql, [string]$Db = 'postgres')
    if ([string]::IsNullOrEmpty($PG_SUPER_PW)) {
        Die "Set `$env:PGPASSWORD to the '$PG_SUPERUSER' password before running this script."
    }
    $env:PGPASSWORD = $PG_SUPER_PW
    $out = & psql -h $DB_HOST -p $DB_PORT -U $PG_SUPERUSER -d $Db -tAc $Sql
    if ($LASTEXITCODE -ne 0) { Die "Admin psql failed: $Sql" }
    return ($out | Out-String).Trim()
}

function Admin-Psql-Exec {
    param([string]$Sql, [string]$Db = 'postgres')
    $env:PGPASSWORD = $PG_SUPER_PW
    & psql -h $DB_HOST -p $DB_PORT -U $PG_SUPERUSER -d $Db -v ON_ERROR_STOP=1 -c $Sql | Out-Null
    if ($LASTEXITCODE -ne 0) { Die "Admin psql failed: $Sql" }
}

function Ensure-Role {
    $exists = Admin-Psql-Capture "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'"
    if ($exists -eq '1') {
        Log "Role '$DB_USER' already exists."
    } else {
        Log "Creating role '$DB_USER'..."
        Admin-Psql-Exec "CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASSWORD';"
    }
}

function Ensure-Database {
    $exists = Admin-Psql-Capture "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'"
    if ($exists -eq '1') {
        Log "Database '$DB_NAME' already exists."
    } else {
        Log "Creating database '$DB_NAME' (owner: $DB_USER)..."
        Admin-Psql-Exec "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    }
    Admin-Psql-Exec "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    Admin-Psql-Exec "GRANT ALL ON SCHEMA public TO $DB_USER;"  $DB_NAME
    Admin-Psql-Exec "ALTER SCHEMA public OWNER TO $DB_USER;"   $DB_NAME
}

function Apply-SqlFiles {
    $files = Get-ChildItem -Path $SqlDir -Filter '*.sql' | Sort-Object Name
    if ($files.Count -eq 0) { Die "No SQL files found under $SqlDir" }

    foreach ($f in $files) {
        Log "Applying $($f.Name)..."
        Invoke-Psql -User $DB_USER -Password $DB_PASSWORD -Db $DB_NAME `
                    -ExtraArgs @('-f', $f.FullName)
    }
}

Ensure-PostgresRunning
Wait-ForPostgres
Ensure-Role
Ensure-Database
Apply-SqlFiles
Log "Done. Database ready: postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
Log "Seeded users (hashes in 09_seed_admin_user.sql — set Postman seedPassword to your Java plaintext)."
Log "  Postman: server/postman/Processor-API.postman_collection.json + Processor-API.local.postman_environment.json"
