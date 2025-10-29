# PosturePal – Guia de Desenvolvimento

Aplicativo híbrido (React + Capacitor) para avaliação de postura em ballet com apoio de MediaPipe e um backend FastAPI que persiste usuários e sessões em MongoDB. A mesma base web serve como PWA e é empacotada para Android/iOS.

---

## Pré-requisitos

| Ferramenta | Versão mínima sugerida | Observações |
|------------|------------------------|-------------|
| [Docker](https://docs.docker.com/get-docker/) | 20+ | Usado para iniciar o Mongo local (`mongo:7`). |
| [Python](https://www.python.org/downloads/) | 3.11+ | Cria a virtualenv `.venv` e instala o backend. |
| [Node.js](https://nodejs.org/en/download/) | 18.x | Necessário para o frontend (React + Capacitor). |
| Android Studio / Xcode (opcional) | — | Apenas se for gerar APK/IPA. |

---

## Início rápido (um comando)

O script `scripts/dev.sh` orquestra o ambiente local:

```bash
bash scripts/dev.sh
```

Ele faz automaticamente:

1. Verifica dependências (`docker`, `python3`, `npm`, `npx`).
2. Sobe (ou cria) o container `posturepal-mongo` expondo `27017`.
3. Cria/atualiza a virtualenv `.venv` e instala `app/backend/requirements.txt`.
4. Roda `npm install` em `app/frontend`.
5. Exporta `REACT_APP_API_URL=http://localhost:8000/api` (pode sobrescrever antes de rodar).
6. Usa `npx concurrently` para iniciar:
   - Backend: `uvicorn server:app --reload --host 0.0.0.0 --port 8000`
   - Frontend: `npm start` (React com HMR) em `http://localhost:3000`

**Encerramento**: `Ctrl+C` finaliza ambos os processos; o container Mongo continua em execução (use `docker stop posturepal-mongo` se quiser desligar).

---

## Fluxo de autenticação

- **Credenciais demo**: continuam disponíveis para apresentação.  
  - Email: `admin@ballet.com`  
  - Senha: `admin`  
  Na tela de login, clique em “Use Demo Credentials” e a conta será preenchida automaticamente. Um toast indica “Demo Mode”.

- **Criar conta real**:
  1. Abra `http://localhost:3000`.
  2. Na tela inicial escolha a aba **Sign Up**.
  3. Informe nome, email e senha (com confirmação) e envie.
  4. O backend cadastra o usuário e já o autentica.

- **Login via API (opcional)**:
  ```bash
  # criar usuário
  curl -X POST http://localhost:8000/api/users \
       -H "Content-Type: application/json" \
       -d '{"name":"Ana Silva","email":"ana@example.com","password":"segredo123"}'

  # login
  curl -X POST http://localhost:8000/api/auth/login \
       -H "Content-Type: application/x-www-form-urlencoded" \
       -d "username=ana@example.com&password=segredo123"
  ```

Os dados retornados ficam persistidos em `localStorage`. Use “Logout” no app para limpar o estado local.

---

## Sessões de postura

O backend aceita sessões completas (score, feedback, landmarks). Exemplo rápido com `curl`:

```bash
USER_ID="(id retornado no cadastro)"

curl -X POST http://localhost:8000/api/sessions \
     -H "Content-Type: application/json" \
     -d '{
       "user_id":"'"$USER_ID"'",
       "exercise_id":"1",
       "exercise_name":"Second Position",
       "score":92,
       "feedback":[{"type":"success","message":"Great alignment!"}],
       "metrics":{
         "shoulder_alignment":0.1,"hip_alignment":0.05,"spine_alignment":0.05,
         "knee_angle":0.0,"left_arm_extension":0.1,"right_arm_extension":0.1,
         "left_arm_height":0.2,"right_arm_height":0.2
       },
       "landmark_frames":[[
         {"x":0.5,"y":0.5,"z":0,"visibility":1},
         {"x":0.6,"y":0.6,"z":0,"visibility":1}
       ]]
     }'

# listar sessões
curl http://localhost:8000/api/users/$USER_ID/sessions

# buscar sessão específica
curl http://localhost:8000/api/sessions/<session_id>
```

As telas **Home** e **Profile** consomem esses dados automaticamente. **Session Result** aceita tanto navegação com state (fluxo normal da câmera) quanto abertura direta por rota (buscando a sessão via API).

---

## Rodando manualmente (opção alternativa)

1. **MongoDB**  
   ```bash
   docker run -d --name posturepal-mongo -p 27017:27017 mongo:7
   ```

2. **Backend**  
   ```bash
   cd PosturePal
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r app/backend/requirements.txt
   uvicorn server:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Frontend**  
   ```bash
   cd app/frontend
   npm install
   npm start
   ```

---

## Testes

- **Lógica de análise sem câmera**  
  ```bash
  cd app/frontend
  npm test -- postureAnalysis.mock.test.js --watchAll=false
  ```
  O teste compara uma pose “boa” e uma “ruim” nos helpers de postura.

- (Opcional) Adicione testes FastAPI com `pytest` para exercitar os endpoints de usuários/sessões.

---

## Preparando build mobile

1. Gere o bundle web: `cd app/frontend && npm run build`
2. Sincronize com Capacitor:
   ```bash
   npx cap sync android
   # ou
   npx cap sync ios
   ```
3. Android:
   - `npx cap open android` ou abra `app/frontend/android` no Android Studio.
   - Execute com um dispositivo/emulador (`Run` ou `Shift+F10`).
4. iOS:
   - `npx cap open ios`, abra em Xcode e faça o build pelo simulador ou dispositivo.

O backend deve estar acessível via rede (defina `REACT_APP_API_URL` para o IP da máquina) antes de empacotar.

---

## Estrutura principal

```
PosturePal/
├── app/backend/          # FastAPI + Motor/Mongo
├── app/frontend/         # React + MediaPipe + Capacitor
├── scripts/dev.sh        # Script de desenvolvimento (Mongo + back + front)
├── control_motors/       # Sketch ESP32 (controle de motores)
└── tests/                # Sketches auxiliares de hardware
```

Com isso, todo o time pode rodar o ambiente dev com um único comando, demonstrar com credenciais demo e registrar usuários/sessões reais quando necessário. Ajustes adicionais (PDF, filtragem de landmarks, etc.) podem seguir o mesmo padrão de integração.
