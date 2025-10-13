#!/usr/bin/env pwsh
# Script para atualizar app Android apos mudancas no React

Write-Host "`n=== Atualizando App Android ===" -ForegroundColor Cyan

Write-Host "`n[1/3] Building React..." -ForegroundColor Yellow
cd app\frontend
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[2/3] Syncing com Android..." -ForegroundColor Yellow
    npx cap sync android
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n[3/3] Pronto!" -ForegroundColor Green
        Write-Host "`nAgora va ao Android Studio e clique em Run (ou Ctrl+R)" -ForegroundColor Cyan
        Write-Host "`nOu execute: npx cap run android" -ForegroundColor Gray
    } else {
        Write-Host "`nErro ao sincronizar!" -ForegroundColor Red
    }
} else {
    Write-Host "`nErro no build!" -ForegroundColor Red
}
