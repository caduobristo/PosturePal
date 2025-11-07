# PosturePal — Updated Run Guide

PosturePal is a hybrid application (React + Capacitor) for posture assessment in ballet exercises. The frontend has been adapted to run locally: it uses a local database adapter (`app/frontend/src/lib/sqliteDB.js`) that currently uses LocalStorage as a fallback and is ready to use the native SQLite plugin in Capacitor builds.

This README explains how to run the frontend locally, how to prepare a mobile build, and important notes about assets (fonts) and local storage.

---

## Minimum Requirements
- Node.js 18.x (or compatible LTS)
- npm (or yarn)
- Capacitor CLI: `npm install -g @capacitor/cli` (optional, for native builds)
- Android Studio / Xcode (optional) — only if generating and debugging APK/IPA

---

## Quick Start — Frontend (Development)

On Linux/macOS/Windows (WSL, PowerShell, etc.):

```bash
# go to the frontend directory
cd app/frontend

# install dependencies
npm install

npm start
```

Note: The scripts in scripts/ (dev.sh, dev.ps1) have been kept but do not start Docker containers. They now only install dependencies and start the frontend for convenience.

Mobile Build (Capacitor)

1. Generate the bundle::

```bash
cd app/frontend
npm run build
```

2. Sync with Capacitor and open the native project:

```bash
npx cap sync android
npx cap open android
```

3. In Android Studio / Xcode, build and run on the device/emulator.

Note: If you want the app to use the native SQLite database instead of the LocalStorage fallback, install and configure the plugin:

```bash
cd app/frontend
npm install @capacitor-community/sqlite
npx cap sync
```

After installing the plugin, app/frontend/src/lib/sqliteDB.js is prepared to detect the native environment and use the plugin's API (the full native implementation can be enabled according to the plugin’s documentation).

---

Fonts and PDF (Important for Native Builds)

The PDF generator (jsPDF) tries to load Inter-Regular.ttf and Inter-Bold.ttf from /fonts (i.e., app/frontend/public/fonts/Inter-*.ttf).
In native environments (Capacitor), these files must be present in the asset bundle so the WebView can open them.
If you need Inter embedded in the PDF in the mobile app, add the two TTF files to:

```
app/frontend/public/fonts/Inter-Regular.ttf
app/frontend/public/fonts/Inter-Bold.ttf
```

If the files are not present, PDF generation will fall back to Helvetica — this is already handled by the code, but to get the correct style, include the TTFs in public/fonts.

---

## Where to Find Relevant Code
- Local adapter (frontend): `app/frontend/src/lib/sqliteDB.js` — functions: initDB, registerUser, login, createSession, listSessionsForUser, fetchSession
- API shim (frontend): `app/frontend/src/lib/api.js` — delegates to the local adapter
- PDF generator: `app/frontend/src/utils/pdfGenerator.js`
- Posture analysis: `app/frontend/src/utils/postureAnalysis.js`
- Frontend entry: `app/frontend/src/index.js` / `app/frontend/src/App.js`

---

