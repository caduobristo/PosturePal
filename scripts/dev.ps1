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

$requiredCommands = @('npm', 'npx')
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

Log "Note: Docker/Mongo steps removed. This script now focuses on frontend setup and start."

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

Log "Starting frontend only (backend and Mongo are not started by this script)."
Push-Location -LiteralPath (Join-Path $projectRoot 'app\frontend')
try {
    & npm start
} finally {
    Pop-Location
}
