# PosturePal – Guia de Execução

Aplicativo híbrido (React + Capacitor) para avaliação de postura em ballet com backend FastAPI e MongoDB. Este arquivo concentra apenas como iniciar e rodar o projeto. Para detalhes de autenticação, sessões e testes do backend, consulte [`BACKEND.md`](BACKEND.md).

---

## Pré-requisitos

| Ferramenta | Versão mínima sugerida | Observações |
|------------|------------------------|-------------|
| [Docker](https://docs.docker.com/get-docker/) | 20+ | Usado para iniciar o Mongo local (`mongo:7`). |
| [Python](https://www.python.org/downloads/) | 3.11+ | Cria a virtualenv `.venv` e instala o backend. |
| [Node.js](https://nodejs.org/en/download/) | 18.x | Necessário para o frontend (React + Capacitor). |
| Android Studio / Xcode (opcional) | — | Apenas se for gerar APK/IPA. |

Certifique-se de ter `docker`, `python`, `npm`/`npx` disponíveis no `PATH` antes de executar os scripts.

---

## Início rápido (backend + frontend + Mongo)

### Windows (PowerShell)
```powershell
cd C:\Users\caduo\OneDrive\Documentos\PosturePal
powershell -ExecutionPolicy Bypass -File scripts\dev.ps1
```

### macOS / Linux
```bash
cd /caminho/para/PosturePal
bash scripts/dev.sh
```

Esses scripts:
1. Verificam dependências (`docker`, `python`, `npm`, `npx`).
2. Criam ou sobem o container `posturepal-mongo` (porta `27017`).
3. Preparam a virtualenv `.venv` e instalam `app/backend/requirements.txt` (inclui `bcrypt`).
4. Executam `npm install` em `app/frontend` quando necessário.
5. Exportam `REACT_APP_API_URL` (pode sobrescrever antes de iniciar).
6. Iniciam backend (`uvicorn` em `http://localhost:8000`) e frontend (`npm start` em `http://localhost:3000`) via `npx concurrently`.

Finalize com `Ctrl+C`. O container Mongo permanece ativo; pare manualmente com `docker stop posturepal-mongo` se quiser desligar.

---

## Scripts úteis

- `scripts/dev.ps1`: fluxo completo no Windows (Mongo + backend + frontend).
- `scripts/dev.sh`: equivalente em Bash (macOS/Linux ou WSL).
- `scripts/backend.ps1`: inicia apenas Mongo e backend FastAPI (útil quando o app Android/iOS já está empacotado).
- `scripts/start-backend.ps1` / `scripts/start-frontend.ps1`: utilizados internamente pelo `dev.ps1`, mas podem ser executados isoladamente para depuração.

---

## Autenticação e sessões

- **Credenciais demo** continuam disponíveis para apresentação rápida:
  - Email: `admin@ballet.com`
  - Senha: `admin`
  - A tela de login possui o botão “Use Demo Credentials”, com toast indicando “Demo Mode”.

- **Cadastro real**: utilize a aba “Sign Up” na tela de login. As credenciais são validadas pelo backend (`POST /api/users`) e salvas no MongoDB. Após o cadastro, o login é automático.

- **Fluxo da câmera**:
  1. Escolha um exercício em **Practice**.
  2. Inicie a avaliação. Durante cinco segundos o MediaPipe coleta landmarks e calcula `score`, `feedback` e `metrics`.
  3. Ao final, os dados são enviados para `POST /api/sessions`. O retorno (com `id`) é usado para navegar para `/result/{id}`.
  4. **Dashboard** e **Profile** consomem `GET /api/users/{user_id}/sessions`; portanto, cada nova sessão salva atualiza as estatísticas automaticamente.

- **Conferindo dados**:
  ```bash
  # Usuário recém logado
  curl -X POST http://localhost:8000/api/auth/login \
       -H "Content-Type: application/x-www-form-urlencoded" \
       -d "username=seu-email&password=sua-senha"

  # Histórico do usuário
  curl http://localhost:8000/api/users/<id>/sessions

  # Conferência no Mongo
  docker exec posturepal-mongo mongosh --quiet \
    --eval "use posturepal; db.sessions.find().pretty()"
  ```

---

## Ajustando IPs para uso em rede local ou mobile

1. **Frontend (`app/frontend/.env`)**  
   - `REACT_APP_BACKEND_URL` e `REACT_APP_API_URL` devem apontar para o IP da máquina que roda o backend, por exemplo `http://192.168.0.10:8000` e `http://192.168.0.10:8000/api`.  
   - Após alterar, reexecute o build (`npm start` ou `npm run build`) para refletir.

2. **Backend (`app/backend/.env`)**  
   - Atualize `CORS_ORIGINS` adicionando o host que consumirá a API (ex.: `http://192.168.0.10:3000`, `capacitor://localhost`). Use valores separados por vírgula.

---

## Preparando build mobile

1. Ajuste as URLs no `.env` do frontend para o IP da máquina (`REACT_APP_API_URL`, `REACT_APP_BACKEND_URL`).  
2. Gere o bundle: `cd app/frontend && npm run build`.  
3. Sincronize com Capacitor: `npx cap sync android` (ou `ios`).  
4. Use `.\run-android.ps1` para build + sync + abrir Android Studio automaticamente, ou `.\update-android.ps1` apenas para build + sync.  
5. Com backend ativo e dispositivos na mesma rede, execute a aplicação pelo Android Studio (`Run`).

---

## Estrutura principal

```
PosturePal/
├── app/backend/          # FastAPI + Motor/Mongo
├── app/frontend/         # React + MediaPipe + Capacitor
├── scripts/              # Scripts de desenvolvimento
├── control_motors/       # Sketch ESP32 (controle de motores)
└── tests/                # Sketches auxiliares de hardware
```

Informações aprofundadas do backend (autenticação, sessões, testes) estão em [`BACKEND.md`](BACKEND.md).
