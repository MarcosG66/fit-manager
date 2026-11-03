# Referência da API REST JSON

Todas as rotas recebem o prefixo `/api`. Em desenvolvimento o Vite usa proxy, e em produção a API funciona no mesmo domínio do React. Para operações com corpo, utilize `Content-Type: application/json`. Sessões são identificadas por cookie HTTP-only `fm_token`.

| Método | Endpoint | Acesso | Operação |
|---|---|---|---|
| GET | `/health` | Público | Verifica API e MySQL |
| POST | `/auth/register` | Público com limite | Cadastra aluno/instrutor/admin (admin usa convite) |
| POST | `/auth/login` | Público com limite | Autentica e define cookie JWT |
| GET | `/auth/me` | Autenticado | Retorna perfil e dados básicos |
| POST | `/auth/logout` | Público | Exclui cookie |
| POST | `/auth/forgot-password` | Público | Envia código de 8 dígitos |
| POST | `/auth/reset-password` | Público | Redefine usando o código |
| GET | `/auth/profile` | Autenticado | Consulta próprios dados |
| PUT | `/auth/profile` | Autenticado | Edita nome, e-mail e dados do aluno |
| PUT | `/auth/password` | Autenticado | Troca senha e invalida sessões |
| GET | `/vinculos/me` | Aluno/instrutor | Exibe vínculo ou código do instrutor |
| POST | `/vinculos/associar` | Aluno | Associa código do instrutor |
| DELETE | `/vinculos/me` | Aluno | Desvincula o instrutor |
| POST | `/vinculos/codigo` | Instrutor | Substitui código de vínculo |
| GET/POST | `/alunos` | Instrutor | Lista/cria alunos |
| GET/PUT/DELETE | `/alunos/:id` | Instrutor dono | Consulta/edita/exclui aluno |
| PATCH | `/alunos/:id/status` | Instrutor dono | Ativa/inativa aluno |
| GET/POST | `/fichas` | Aluno (GET próprias), Instrutor (GET/POST dos vinculados) | Lista/cria fichas |
| GET/PUT/DELETE | `/fichas/:id` | Aluno/instrutor autorizado (PUT/DELETE instrutor) | Consulta/edita/arquiva |
| GET/POST | `/fichas/:id/itens` | Aluno (GET), instrutor (POST) autorizado | Itens da ficha |
| PUT/DELETE | `/fichas/:id/itens/:itemId` | Instrutor autorizado | Edita/arquiva item |
| GET/POST/PUT/DELETE | `/grupos`, `/grupos/:id` | Leitura autenticada, escrita instrutor/admin | Catálogo de grupos |
| GET/POST/PUT/DELETE | `/exercicios`, `/exercicios/:id` | Leitura autenticada, escrita instrutor/admin | Catálogo de exercícios |
| GET/POST | `/cargas` | Aluno | Históricos e novas cargas |
| GET | `/cargas/evolucao` | Aluno | Evolução semanal por exercício |
| PUT | `/cargas/conclusao` | Aluno | Conclui exercício do dia |
| GET/POST/DELETE | `/avaliacoes`, `/avaliacoes/:id` | Aluno | Avaliações e IMC |
| GET | `/usuarios` | Admin | Lista e busca usuários |
| GET | `/usuarios/totais` | Admin | Totais por perfil |
| PATCH | `/usuarios/:id/ativo` | Admin | Ativa/desativa usuário, invalida JWT |

## Exemplos

**Cadastro de aluno vinculado:**

```http
POST /api/auth/register
Content-Type: application/json

{"nome":"Maria Silva","email":"maria@example.com","senha":"SenhaExemplo123!","perfil":"aluno","objetivo":"Hipertrofia","plano":"Mensal","codigoInstrutor":"9A10B32F45C6"}
```

**Cadastro de administrador:** mesmo endpoint, `perfil:"admin"` e `codigoAdmin:"CODIGO_PRIVADO_DO_SERVIDOR"`. O servidor compara contra o segredo `ADMIN_SIGNUP_CODE`. Não publique o valor real em nenhum arquivo do front-end.

**Registro de carga:**

```http
POST /api/cargas
Content-Type: application/json
Cookie: fm_token=<cookie gerenciado pelo navegador>

{"item_ficha_id":15,"carga_kg":32.5}
```

**Criar ficha:**

```http
POST /api/fichas
Content-Type: application/json

{"aluno_id":3,"nome":"Treino A - Peito","dia_semana":1,"itens":[{"exercicio_id":4,"series":3,"repeticoes":"12","descanso_seg":60,"ordem":0}]}
```

As permissões são conferidas no servidor, independentemente do menu exibido no React.
