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

## Testes

- **Lógica de análise sem câmera**  
  ```bash
  cd app/frontend
  npm test -- postureAnalysis.mock.test.js --watchAll=false
  ```
  O teste compara uma pose “boa” e uma “ruim” nos helpers de postura.

- (Opcional) Adicione testes FastAPI com `pytest` para exercitar os endpoints de usuários/sessões.

---
