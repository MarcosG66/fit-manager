# FitManager — guia para apresentar o código

Este arquivo serve como um **mapa de leitura**: abra os arquivos nesta ordem no VS Code para que a explicação siga o caminho de uma informação desde a interface até o banco de dados.

## 1. Arquitetura em uma frase

> O React mostra as telas; os componentes reutilizáveis montam a interface; `services/api.js` envia requisições HTTP; o Express recebe, valida e autoriza cada operação; o MySQL armazena os dados.

Em desenvolvimento, `npm run dev` inicia dois servidores: Vite (porta 5173) e Express (porta 3001). Os dois contêineres Docker são apenas infraestrutura: MySQL e Mailpit. Para publicação, o Express também pode entregar o build do React.

## 2. Ordem sugerida para a apresentação

1. **`client/src/App.jsx` — navegação:** mostre `AppRoutes`, `PrivateRoute`, `PublicRoute` e o mapeamento de perfis para dashboards. Explique que a proteção visual da rota não substitui a verificação feita pela API.
2. **`client/src/pages/StudentDashboard.jsx` e `InstructorDashboard.jsx` — páginas:** cada página escolhe quais componentes devem aparecer. O instrutor tem uma lista de alunos e uma gestão de treinos; o aluno tem treino, métricas e evolução.
3. **`client/src/components/` — reaproveitamento:** mostre `CardExercicio`, `FormFicha`, `BarraNavegacao` e os componentes nas subpastas `aluno/` e `instrutor/`.
4. **`client/src/services/api.js` — comunicação:** a função `api()` encapsula `fetch`, envia JSON e aceita cookies. Isso evita repetir chamadas HTTP em cada formulário.
5. **`server/src/index.js` — servidor:** inicializa o Express, configura segurança e associa os grupos de rotas às URLs `/api/...`.
6. **`server/src/routes/auth.js` — autenticação:** destaque o cadastro com `bcrypt.hash`, o login com `bcrypt.compare` e a recuperação com código de oito dígitos.
7. **`server/src/middleware/auth.js` — autorização:** mostre `authenticate`, `requireRole` e `signSession`; o JWT é assinado e enviado por cookie `httpOnly`.
8. **`server/src/routes/fichas.js` — regra de negócio:** apresente a criação de ficha e seus itens usando uma transação no MySQL.
9. **`server/src/config/db.js` — conexão:** `pool` reutiliza conexões e `transaction()` aplica `COMMIT` ou `ROLLBACK`.
10. **`server/sql/schema.sql` — persistência:** mostre os relacionamentos `usuario → aluno/instrutor → ficha_treino → item_ficha → exercício`.

## 3. Exemplo para explicar um cadastro

**Tela:** `RegisterPage.jsx` recebe os campos, chama `register()` do contexto e este utiliza `api()`.

**Servidor:** `POST /api/auth/register` valida o corpo com Zod, verifica se o e-mail existe, transforma a senha em hash bcrypt, abre uma transação e insere os registros relacionados.

**Sessão:** o servidor emite um JWT assinado; o navegador recebe um cookie `httpOnly` e o React armazena apenas os dados públicos do usuário no contexto.

**Banco:** a senha nunca é gravada em texto puro. Uma exceção no meio da transação desfaz todas as inserções para evitar dados incompletos.

## 4. Exemplo para explicar a redefinição da senha

- `POST /api/auth/forgot-password` procura a conta sem revelar sua existência, gera um código numérico aleatório de oito dígitos e envia por e-mail.
- O banco armazena **o HMAC do código**, não o código original, e define validade de dez minutos.
- `POST /api/auth/reset-password` valida o código com comparação em tempo constante; tentativas incorretas são contabilizadas.
- Em caso de sucesso, a senha ganha um novo hash e `token_version` é incrementada para invalidar as sessões anteriores.
- **No ambiente de desenvolvimento**, o Mailpit captura os e-mails. Para uma demonstração em domínio público, precisa configurar um serviço de envio real.

## 5. Por que foram criados componentes separados?

`pages/` controla uma **tela inteira**; `components/` controla uma **parte reutilizável** da tela. Exemplo:

```text
pages/InstructorDashboard.jsx
  ├── components/PainelLayout.jsx
  ├── components/instrutor/ListaAlunos.jsx
  │   ├── components/StatCard.jsx
  │   ├── components/FormAluno.jsx
  │   └── components/Modal.jsx
  └── components/instrutor/GestaoTreinos.jsx
      ├── components/FormFicha.jsx
      └── components/Modal.jsx
```

Um componente recebe dados em `props` e usa `useState` para controlar suas próprias interações. O hook `useResource` centraliza carregamentos e recarregamentos da API.

## 6. Como são tratados os erros?

- **Zod:** recusa dados ausentes ou fora dos formatos esperados.
- **`requireRole`:** proíbe operações que não pertencem ao perfil autenticado.
- **`utils/access.js`:** impede acessar fichas ou alunos de outro instrutor.
- **`HttpError` + `errorHandler`:** convertem falhas conhecidas em respostas HTTP com status, como 400, 401, 403 e 409.
- **Transações:** alterações relacionadas acontecem juntas ou são desfeitas.

## 7. Perguntas que o professor pode fazer

**Por que não conectar o React diretamente ao MySQL?** Porque as credenciais do banco e as regras de permissão precisam ficar no servidor, não no navegador.

**Por que bcrypt em vez de guardar a senha?** Porque o banco armazena apenas um hash lento e com salt, reduzindo o risco de exposição de senhas em caso de vazamento.

**Por que JWT se existe um banco?** O JWT identifica uma sessão assinada; a API ainda consulta o banco para verificar se o usuário existe, seu perfil e a versão válida do token.

**Para que serve o Docker?** Para fornecer os serviços de infraestrutura (MySQL e e-mails de teste), sem instalar todos manualmente no Windows. O React e Express rodam no Node.js local quando usamos `npm run dev`.

**O MVP está pronto para produção?** Não. O código foi preparado para desenvolvimento e demonstração. Antes de usar com clientes reais são necessários testes completos, revisão de segurança, backups, SMTP real e configuração de hospedagem.

## 8. Limitações conhecidas do MVP

- A associação automática entre aluno cadastrado publicamente e instrutor ainda não existe.
- O registro público de instrutores precisaria de aprovação em uma implantação real.
- A interface não possui todos os recursos de um produto comercial.
- Não existem testes automatizados end-to-end nem validação de todos os fluxos com MySQL nesta entrega.

## 9. Comandos para demonstrar

```bash
npm install
npm run install:all
npm run setup

docker compose up -d --wait
npm run db:init --prefix server
npm run db:seed --prefix server
npm run dev
```

Para formatar e verificar o estilo depois de instalar as dependências:

```bash
npm run format
npm run format:check
```

> O script de formatação utiliza Prettier. Ele não modifica as regras de negócio; organiza a apresentação visual do código.
