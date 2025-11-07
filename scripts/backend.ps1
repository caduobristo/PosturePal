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

$requiredCommands = @()

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

Log "Note: Docker/Mongo management removed. If you need the backend with Mongo, run it separately and set MONGO_URL in app/backend/.env"

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
