#requires -Version 5.1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location -LiteralPath $projectRoot

function Log {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message
    )

    Write-Host "[backend] $Message"
}

$requiredCommands = @('docker')
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
& $pipPath install -r $requirementsPath
if ($LASTEXITCODE -ne 0) {
    throw "Failed to install backend dependencies."
}

$backendDir = Join-Path $projectRoot 'app\backend'
Set-Location -LiteralPath $backendDir

Log "Starting backend (uvicorn)..."
& $pythonInVenv -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
exit $LASTEXITCODE
