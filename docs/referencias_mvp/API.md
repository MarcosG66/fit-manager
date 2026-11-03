# Referência da API REST — `/api`

**Base (dev):** `http://localhost:3001/api`. Os corpos de escrita são JSON. Toda resposta de erro retorna `{ "error": "..." }`; algumas retornam `detalhes`. O navegador envia automaticamente o cookie JWT `fm_token` em chamadas `fetch` com `credentials: 'include'`. Não enviar token por query string nem persistir token em localStorage. O servidor valida papéis e vínculos; bloquear apenas links na tela não é autorização.

## Autenticação (público)

| Método | Rota | Corpo | Resultado |
| --- | --- | --- | --- |
| POST | `/auth/register` | `{nome,email,senha,perfil:'aluno'\|'instrutor',objetivo?,plano?}` | Cria conta, define cookie, 201 |
| POST | `/auth/login` | `{email,senha}` | Cookie JWT e `{user}` |
| GET | `/auth/me` | — | Usuário autenticado (401 se inválido) |
| POST | `/auth/logout` | — | Limpa cookie JWT |
| POST | `/auth/forgot-password` | `{email}` | Envia código de **8 dígitos** para endereço existente; resposta genérica |
| POST | `/auth/reset-password` | `{email,codigo,novaSenha}` | Redefine hash de senha, revoga JWTs anteriores |
| GET | `/health` | — | Verifica conexão com banco |

## Alunos (instrutor)

| Método | Rota | Corpo/Parâmetros |
| --- | --- | --- |
| GET | `/alunos?busca=&status=ativo` | Listagem dos próprios alunos |
| GET | `/alunos/:id` | Dados do aluno vinculado |
| POST | `/alunos` | `{nome,email,objetivo,plano,status?,senha?}` |
| PUT | `/alunos/:id` | Campos editáveis (parciais): `{nome?,email?,objetivo?,plano?,status?}` |
| PATCH | `/alunos/:id/status` | `{status:'ativo'\|'inativo'}` |
| DELETE | `/alunos/:id` | Exclui usuário-aluno e registros relacionados |

## Catálogo (GET: todos autenticados; escrita: instrutor/admin)

| Método | Rota | Corpo |
| --- | --- | --- |
| GET | `/grupos` | Lista |
| POST | `/grupos` | `{nome}` |
| PUT | `/grupos/:id` | `{nome}` |
| DELETE | `/grupos/:id` | Sem referências em exercícios |
| GET | `/exercicios?grupo_id=&busca=` | Lista |
| POST | `/exercicios` | `{nome,descricao,grupo_id}` |
| PUT | `/exercicios/:id` | `{nome,descricao,grupo_id}` |
| DELETE | `/exercicios/:id` | Bloqueia exclusão se usado numa ficha |

## Fichas (GET: dono aluno e instrutor vinculado; escrita: instrutor)

| Método | Rota | Corpo |
| --- | --- | --- |
| GET | `/fichas` | Aluno obtém as próprias fichas automaticamente |
| GET | `/fichas?aluno_id=1` | Instrutor obtém fichas do aluno vinculado |
| GET | `/fichas/:id` | Ficha com itens |
| POST | `/fichas` | `{aluno_id,nome,dia_semana,itens:[{exercicio_id,series,repeticoes,descanso_seg,carga_sugerida_kg?,ordem?}]}` |
| PUT | `/fichas/:id` | Mesma estrutura; em `itens`, fornecer `id` existente para preservar seu histórico |
| DELETE | `/fichas/:id` | Remove ficha e seus itens e históricos associados |
| GET | `/fichas/:id/itens` | Itens |
| POST | `/fichas/:id/itens` | Um objeto de item |
| PUT | `/fichas/:id/itens/:itemId` | Um objeto de item |
| DELETE | `/fichas/:id/itens/:itemId` | Não permite excluir o último exercício |

`dia_semana` é inteiro de 0 (domingo) a 6 (sábado). Uma ficha deve ter pelo menos um item. Na atualização em bloco, os itens existentes com mesmo `id` são mantidos, novos são inseridos e ausentes são excluídos (junto do histórico correspondente). A mudança de exercício de um item com histórico prévio é bloqueada.

## Treino, histórico, medidas (aluno)

| Método | Rota | Corpo |
| --- | --- | --- |
| POST | `/cargas` | `{item_ficha_id,carga_kg}` — cria ponto no histórico |
| PUT | `/cargas/conclusao` | `{item_ficha_id,concluido:true\|false}` — marca o treino do dia |
| GET | `/cargas` | Últimas 200 cargas próprias |
| GET | `/cargas/evolucao?exercicio_id=` | Máximo semanal da carga por exercício |
| GET | `/avaliacoes` | Histórico com IMC calculado |
| POST | `/avaliacoes` | `{peso_kg,altura_m}` (altura em metros) |
| DELETE | `/avaliacoes/:id` | Remove uma avaliação própria |

## Administrador

| Método | Rota | Resultado |
| --- | --- | --- |
| GET | `/usuarios?busca=` | Lista nome, e-mail, perfil, data e status (sem senhas) |
| GET | `/usuarios/totais` | `{data:{aluno:0,instrutor:0,admin:0}}` |

## Exemplo usando curl

```bash
# Login, salva cookie em arquivo local (arquivo é sensível!)
curl -i -c cookies.txt -H 'Content-Type: application/json' \
  -d '{"email":"ana@email.com","senha":"SENHA_DO_ENV"}' \
  http://localhost:3001/api/auth/login

# Ler ficha autenticada
curl -b cookies.txt http://localhost:3001/api/fichas

# Marcar conclusão (conforme política de origem do servidor)
curl -X PUT -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"item_ficha_id":1,"concluido":true}' \
  http://localhost:3001/api/cargas/conclusao
```

Não suba `cookies.txt` ou arquivos `.env` para o repositório.
