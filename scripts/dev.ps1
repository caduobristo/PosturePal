#requires -Version 5.1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location -LiteralPath $projectRoot

function Log {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message
    )

    Write-Host "[dev] $Message"
}

$requiredCommands = @('docker', 'npm', 'npx')
foreach ($cmd in $requiredCommands) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Error "Error: '$cmd' is required but was not found in PATH."
        exit 1
    }
}

$pythonCommandInfo = $null
foreach ($candidate in @('python3', 'python')) {
    $commandInfo = Get-Command $candidate -ErrorAction SilentlyContinue
    if ($commandInfo) {
        $pythonCommandInfo = $commandInfo
        break
    }
}

if (-not $pythonCommandInfo) {
    Write-Error "Error: python3 (or python) is required but was not found in PATH."
    exit 1
}

$pythonCommand = $pythonCommandInfo.Path

$mongoContainer = 'posturepal-mongo'
$runningContainers = @(& docker ps --format '{{.Names}}')
if ($LASTEXITCODE -ne 0) {
    throw "Failed to list running Docker containers."
}

if ($runningContainers -contains $mongoContainer) {
    Log "Mongo container already running."
} else {
    $allContainers = @(& docker ps -a --format '{{.Names}}')
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to list existing Docker containers."
    }

    if ($allContainers -contains $mongoContainer) {
        Log "Starting existing Mongo container ($mongoContainer)..."
        & docker start $mongoContainer | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to start Mongo container '$mongoContainer'."
        }
    } else {
        Log "Creating Mongo container ($mongoContainer)..."
        & docker run -d --name $mongoContainer -p 27017:27017 mongo:7 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to create Mongo container '$mongoContainer'."
        }
    }
}

$venvPath = Join-Path $projectRoot '.venv'
if (-not (Test-Path -LiteralPath $venvPath)) {
    Log "Creating Python virtual environment..."
    & $pythonCommand -m venv $venvPath
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create virtual environment at '$venvPath'."
    }
}

$scriptsPath = Join-Path $venvPath 'Scripts'
$pythonInVenv = Join-Path $scriptsPath 'python.exe'
if (-not (Test-Path -LiteralPath $pythonInVenv)) {
    $pythonInVenv = Join-Path $scriptsPath 'python'
}

if (-not (Test-Path -LiteralPath $pythonInVenv)) {
    throw "Could not locate the Python executable inside the virtual environment."
}

$pipPath = Join-Path $scriptsPath 'pip.exe'
if (-not (Test-Path -LiteralPath $pipPath)) {
    $pipPath = Join-Path $scriptsPath 'pip'
}

if (-not (Test-Path -LiteralPath $pipPath)) {
    throw "Could not locate pip inside the virtual environment."
}

$requirementsPath = Join-Path $projectRoot 'app\backend\requirements.txt'
Log "Installing backend dependencies..."
& $pipPath install -r $requirementsPath *> $null
$pipExitCode = $LASTEXITCODE
if ($pipExitCode -ne 0) {
    throw "Failed to install backend dependencies."
}

Log "Installing frontend dependencies..."
Push-Location -LiteralPath (Join-Path $projectRoot 'app\frontend')
try {
    & npm install *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install frontend dependencies."
    }
} finally {
    Pop-Location
}

if (-not $env:REACT_APP_API_URL -or [string]::IsNullOrWhiteSpace($env:REACT_APP_API_URL)) {
    $env:REACT_APP_API_URL = 'http://localhost:8000/api'
}

$backendDir = Join-Path $projectRoot 'app\backend'
$frontendDir = Join-Path $projectRoot 'app\frontend'
$backendScript = Join-Path $PSScriptRoot 'start-backend.ps1'
$frontendScript = Join-Path $PSScriptRoot 'start-frontend.ps1'

$backendCommand = [string]::Format(
    'powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File "{0}" -PythonExecutable "{1}" -BackendDir "{2}"',
    $backendScript,
    $pythonInVenv,
    $backendDir
)

$frontendCommand = [string]::Format(
    'powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File "{0}" -FrontendDir "{1}"',
    $frontendScript,
    $frontendDir
)

Log "Starting backend and frontend..."
$concurrentlyArgs = @(
    '--yes',
    'concurrently',
    '--kill-others',
    '--names', 'backend,frontend',
    '--prefix-colors', 'red,blue',
    $backendCommand,
    $frontendCommand
)

& npx @concurrentlyArgs
$exitCode = $LASTEXITCODE
exit $exitCode
