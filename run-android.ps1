#!/usr/bin/env pwsh
# Script completo: Build + Sync + Run no Android

Write-Host "`n=== Build e Run Android ===" -ForegroundColor Cyan

cd app\frontend

Write-Host "`n[1/3] Building React..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nErro no build!" -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/3] Syncing com Android..." -ForegroundColor Yellow
npx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nErro ao sincronizar!" -ForegroundColor Red
    exit 1
}

Write-Host "`n[3/3] Abrindo/Atualizando Android Studio..." -ForegroundColor Yellow
npx cap open android

Write-Host "`nPronto! Android Studio foi aberto." -ForegroundColor Green
Write-Host "Clique em Run no Android Studio para ver as mudancas.`n" -ForegroundColor Cyan
