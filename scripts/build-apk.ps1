# Script para gerar APK do PosturePal
# Autor: GitHub Copilot
# Data: 2025-11-12

Write-Host "🚀 PosturePal - Gerador de APK" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Cores para output
function Write-Success { Write-Host "✅ $args" -ForegroundColor Green }
function Write-Error { Write-Host "❌ $args" -ForegroundColor Red }
function Write-Info { Write-Host "ℹ️  $args" -ForegroundColor Yellow }
function Write-Step { Write-Host "📦 $args" -ForegroundColor Blue }

# Diretórios
$frontendDir = "C:\Users\sneto\PosturePal\app\frontend"
$androidDir = "$frontendDir\android"
$buildDir = "$androidDir\app\build\outputs\apk"

# Menu
Write-Host "Escolha o tipo de APK:" -ForegroundColor White
Write-Host "1. Debug APK (rápido, não assinado)" -ForegroundColor White
Write-Host "2. Release APK (assinado, otimizado)" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Digite 1 ou 2"

if ($choice -eq "1") {
    # APK Debug
    Write-Step "Gerando APK de Debug..."
    Write-Info "Este APK é apenas para testes e não pode ser publicado na Play Store"
    Write-Host ""
    
    Set-Location $frontendDir
    
    Write-Step "1/3 - Compilando código React..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha ao compilar o código React"
        exit 1
    }
    Write-Success "Código React compilado!"
    
    Write-Step "2/3 - Sincronizando com Capacitor..."
    npx cap sync android
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha ao sincronizar com Capacitor"
        exit 1
    }
    Write-Success "Sincronização concluída!"
    
    Write-Step "3/3 - Gerando APK Debug..."
    Set-Location $androidDir
    .\gradlew assembleDebug
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha ao gerar APK"
        exit 1
    }
    
    $apkPath = "$buildDir\debug\app-debug.apk"
    if (Test-Path $apkPath) {
        Write-Success "APK gerado com sucesso!"
        Write-Host ""
        Write-Host "📂 Localização do APK:" -ForegroundColor Cyan
        Write-Host "   $apkPath" -ForegroundColor White
        Write-Host ""
        Write-Info "Para instalar no dispositivo:"
        Write-Host "   adb install -r `"$apkPath`"" -ForegroundColor Gray
        
        # Abrir pasta no Explorer
        $folder = Split-Path $apkPath
        Start-Process explorer.exe $folder
    } else {
        Write-Error "APK não encontrado no caminho esperado"
    }
    
} elseif ($choice -eq "2") {
    # APK Release
    Write-Step "Gerando APK de Release..."
    Write-Info "Este APK será assinado e otimizado para distribuição"
    Write-Host ""
    
    # Verificar se existe keystore
    $keystorePath = "$androidDir\posturepal-release-key.jks"
    $keyPropsPath = "$androidDir\key.properties"
    
    if (-not (Test-Path $keystorePath)) {
        Write-Error "Keystore não encontrada!"
        Write-Info "Execute primeiro: keytool -genkey -v -keystore posturepal-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias posturepal"
        exit 1
    }
    
    if (-not (Test-Path $keyPropsPath)) {
        Write-Error "Arquivo key.properties não encontrado!"
        Write-Info "Crie o arquivo $keyPropsPath com:"
        Write-Host "storePassword=SUA_SENHA" -ForegroundColor Gray
        Write-Host "keyPassword=SUA_SENHA" -ForegroundColor Gray
        Write-Host "keyAlias=posturepal" -ForegroundColor Gray
        Write-Host "storeFile=../posturepal-release-key.jks" -ForegroundColor Gray
        exit 1
    }
    
    Set-Location $frontendDir
    
    Write-Step "1/3 - Compilando código React..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha ao compilar o código React"
        exit 1
    }
    Write-Success "Código React compilado!"
    
    Write-Step "2/3 - Sincronizando com Capacitor..."
    npx cap sync android
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha ao sincronizar com Capacitor"
        exit 1
    }
    Write-Success "Sincronização concluída!"
    
    Write-Step "3/3 - Gerando APK Release assinado..."
    Set-Location $androidDir
    .\gradlew assembleRelease
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha ao gerar APK"
        exit 1
    }
    
    $apkPath = "$buildDir\release\app-release.apk"
    if (Test-Path $apkPath) {
        Write-Success "APK Release gerado com sucesso!"
        Write-Host ""
        Write-Host "📂 Localização do APK:" -ForegroundColor Cyan
        Write-Host "   $apkPath" -ForegroundColor White
        Write-Host ""
        
        # Informações do APK
        $apkSize = (Get-Item $apkPath).Length / 1MB
        Write-Host "📊 Tamanho: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Cyan
        Write-Host ""
        
        Write-Success "APK pronto para distribuição!"
        Write-Info "Você pode:"
        Write-Host "   • Instalar diretamente: adb install -r `"$apkPath`"" -ForegroundColor Gray
        Write-Host "   • Compartilhar com outras pessoas" -ForegroundColor Gray
        Write-Host "   • Publicar na Google Play Store" -ForegroundColor Gray
        
        # Abrir pasta no Explorer
        $folder = Split-Path $apkPath
        Start-Process explorer.exe $folder
    } else {
        Write-Error "APK não encontrado no caminho esperado"
    }
    
} else {
    Write-Error "Opção inválida! Digite 1 ou 2"
    exit 1
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✨ Processo concluído!" -ForegroundColor Green
