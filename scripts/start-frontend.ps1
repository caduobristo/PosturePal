param(
    [Parameter(Mandatory = $true)]
    [string]$FrontendDir
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Set-Location -LiteralPath $FrontendDir
npm start
