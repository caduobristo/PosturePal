# PosturePal – Guia de Execução

Aplicativo híbrido (React + Capacitor) para avaliação de postura em ballet com backend FastAPI e MongoDB. Este arquivo concentra apenas como iniciar e rodar o projeto. Para detalhes de autenticação, sessões e testes do backend, consulte [`BACKEND.md`](BACKEND.md).

---

## Pré-requisitos

| Ferramenta | Versão mínima sugerida | Observações |
|------------|------------------------|-------------|
| [Python](https://www.python.org/downloads/) | 3.11+ | Cria a virtualenv `.venv` e (opcional) instala o backend. |
| [Python](https://www.python.org/downloads/) | 3.11+ | Cria a virtualenv `.venv` e instala o backend. |
| [Node.js](https://nodejs.org/en/download/) | 18.x | Necessário para o frontend (React + Capacitor). |
| Android Studio / Xcode (opcional) | — | Apenas se for gerar APK/IPA. |

Certifique-se de ter `python`, `npm`/`npx` disponíveis no `PATH` antes de executar os scripts.

---

## Início rápido (frontend - local)

### Windows (PowerShell)
```powershell
cd C:\caminho\para\PosturePal
powershell -ExecutionPolicy Bypass -File scripts\dev.ps1
```

### macOS / Linux
```bash
cd /caminho/para/PosturePal
bash scripts/dev.sh
```

Esses scripts instalão dependências do frontend e iniciam a aplicação React/Capacitor localmente. O frontend agora usa um banco local (SQLite via plugin Capacitor, quando disponível, ou fallback para localStorage) e não depende mais de um backend ou container Mongo para rodar em modo demo/local.

---

## Scripts úteis

- `scripts/dev.ps1`: instala dependências do frontend e inicia o frontend no Windows.
- `scripts/dev.sh`: instala dependências do frontend e inicia o frontend no macOS/Linux.
- `scripts/backend.ps1`: (opcional) prepara Python venv e inicia o backend FastAPI sem tentar gerenciar Mongo. If you need Mongo-backed backend, set up a Mongo instance and configure `app/backend/.env` accordingly.
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
