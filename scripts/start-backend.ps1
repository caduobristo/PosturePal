param(
    [Parameter(Mandatory = $true)]
    [string]$PythonExecutable,

    [Parameter(Mandatory = $true)]
    [string]$BackendDir
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Set-Location -LiteralPath $BackendDir
& $PythonExecutable -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
