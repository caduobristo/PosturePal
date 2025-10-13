# Como Testar o PosturePal

## Android Studio

1. Abra o Android Studio
2. Open Project → `PosturePal\app\frontend\android`
3. Conecte o tablet via USB
4. Clique no botão (Run) ou pressione Shift+F10
5. Selecione seu disp na lista de dispositivos
6. Aguarde a instalação e teste o app

## Scripts PowerShell

### `run-android.ps1`
Compila e gera o APK automaticamente:
```powershell
.\run-android.ps1
```
APK gerado em: `app\frontend\android\app\build\outputs\apk\debug\app-debug.apk`

### `update-android.ps1`
Atualiza o código Android após modificar arquivos React:
```powershell
.\update-android.ps1
```
Executa: `npm run build` + `npx cap sync android`

