# FitManager — Versão Final (Etapa 3)

Sistema web completo para academias, baseado no protótipo e no **Plano de Trabalho (Etapa 1)**. O código preserva a estrutura componentizada do MVP e implementa os requisitos RF01–RF10 e RNF01–RNF05.

**Tecnologias:** React 19 + Vite 6 + Bootstrap 5, Node.js 22 + Express 4, API REST JSON e MySQL 8.4 (`mysql2`). Senhas em hash bcrypt, JWT em cookie `httpOnly`, redefinição por código de 8 dígitos, validação Zod e controle por perfil.

> **Status de verificação:** Os arquivos JavaScript do servidor passaram na análise estática de sintaxe; os dois testes unitários de geração de códigos passaram. O ambiente desta entrega não permitiu concluir `npm install`, build Vite ou testes integrados com MySQL. Execute os testes documentados antes da apresentação e especialmente antes de disponibilizar contas reais.

## 1. O que foi entregue

- Cadastro e login de **aluno, instrutor e administrador**. O administrador exige código de convite secreto, configurado em `server/.env`; não existe promoção irrestrita de visitante a admin.
- Recuperação de senha por código numérico de 8 dígitos, expiração em 10 minutos, limitação de tentativas e envio por e-mail (Mailpit local / SMTP ou Resend na nuvem).
- Edição do próprio perfil e alteração de senha com invalidação das sessões anteriores.
- Instrutor pode compartilhar um **código de 12 caracteres** para associar alunos cadastrados por conta própria. Aluno pode informar o código no cadastro ou após entrar.
- Instrutor gerencia alunos, status, fichas, itens e catálogo; aluno consulta treinos, registra carga e conclusão, métricas, IMC e gráficos; admin consulta usuários, totais, busca, catálogo e ativa/desativa contas.
- Arquivamento de fichas e itens excluídos para **preservar o histórico de cargas** dos treinos anteriores. A remoção permanente de alunos ainda exclui seus registros, conforme o CRUD solicitado.
- Scripts SQL e migrações **sem apagar o banco do MVP**, documentação do esquema e deploy, `render.yaml` e `Dockerfile`.
- API smoke test (`npm run test:e2e`) para verificar autorização e o fluxo instrutor → aluno → ficha → carga → histórico, utilizando banco real de desenvolvimento.

## 2. Estrutura

```text
FitManager/
├── client/
│   ├── src/
│   │   ├── components/        # CardExercicio, Perfil, BarraNavegacao, MinhaConta, VinculoInstrutor...
│   │   ├── components/aluno/  # TreinosAluno, MetricasAluno, EvolucaoAluno
│   │   ├── components/instrutor/ # ListaAlunos, GestaoTreinos
│   │   ├── pages/             # Login, cadastro, recuperação e dashboards dos 3 perfis
│   │   ├── contexts/          # AuthContext
│   │   ├── hooks/             # useResource
│   │   ├── services/          # api.js: requisições HTTP JSON
│   │   └── styles/            # CSS + Bootstrap
│   └── vite.config.js
├── server/
│   ├── src/config/db.js       # Pool do MySQL e transações
│   ├── src/middleware/auth.js # JWT, autenticação, restrição por papel
│   ├── src/routes/           # auth, alunos, fichas, catálogo, cargas, avaliações, usuários, vínculos
│   ├── src/services/mail.js  # SMTP ou Resend
│   ├── src/utils/            # Acesso a dados, validação e códigos
│   ├── sql/schema.sql        # Criação das 11 tabelas
│   ├── sql/create_database_local.sql
│   ├── scripts/             # Criação, migração, seed, diagnóstico, smoke test
│   └── tests/               # Testes unitários
├── docs/                     # Banco, publicação, requisitos, código e testes
├── docker-compose.yml        # MySQL 8.4 + Mailpit (desenvolvimento)
├── Dockerfile                # Publicação em contêiner único (web + API)
├── render.yaml               # Publicação Render (web + API, banco externo)
└── scripts/setup-dev.mjs     # Geração de configurações privadas locais
```

## 3. Pré-requisitos

- Node.js 22 LTS ou superior e npm;
- Docker Desktop **ou** MySQL 8.4 instalado diretamente;
- editor como VS Code; Git para versionamento.

## 4. Instalação local DO ZERO (com Docker)

Abra um terminal **na raiz `FitManager/`**:

```bash
npm run setup
npm install
npm run install:all
docker compose up -d --wait
npm run db:init
npm run db:check
npm run db:seed  # opcional: cria contas e exercícios de exemplo
npm run dev
```

Acesse: **http://localhost:5173** (React) e **http://localhost:3001/api/health** (Express/MySQL). E-mails de recuperação em **http://localhost:8025** (Mailpit).

`npm run setup` gera `server/.env`, `client/.env` e `CONTAS_LOCAIS.txt` (credenciais e código administrativo). Mantenha-os privados: `.gitignore` os impede de entrar no repositório por engano. `npm run db:seed` usa as três senhas aleatórias desse `.env` e é opcional.

**Nunca execute `docker compose down -v` por engano**: o `-v` remove o volume persistente do MySQL e os dados locais. `docker compose down` sem `-v` preserva o volume.

## 5. Atualizar seu banco do MVP, preservando os dados

1. Faça backup do banco do MVP (ver `docs/BANCO_MYSQL.md`).
2. Se deseja continuar usando o **mesmo volume Docker**, copie os arquivos novos **por cima da pasta original do MVP** (mantendo o nome/caminho da pasta e `server/.env`, `client/.env`); não substitua suas credenciais locais. Se extrair em outra pasta, o Docker Compose pode criar **outro volume com outro nome** (porque o nome do projeto Compose muda). Nesse caso, use o backup/restauração explicado em `docs/BANCO_MYSQL.md`.
3. Pare o contêiner do MVP (`docker compose down`, sem `-v`) antes de reiniciar os serviços na pasta escolhida.
4. Execute:

```bash
npm run setup
npm install
npm run install:all
docker compose up -d --wait
npm run db:init
npm run db:check
npm run dev
```

`db:init` contém `CREATE TABLE IF NOT EXISTS` e depois aplica `server/scripts/migrate-db.js`, que acrescenta apenas as colunas novas: `usuario.ativo`, `instrutor.codigo_vinculo`, `ficha_treino.arquivada_em`, `item_ficha.removido_em`. Os registros antigos continuam presentes.

**Não substitua nem recrie o volume `mysql_data` se quiser preservar seu MVP.** O nome real do volume é prefixado pelo nome do projeto Compose e depende da pasta; confirme com `docker volume ls`. A nova versão oferece migração de esquema, mas não substitui a necessidade de backups ou de validar a migração em uma cópia antes de utilizá-la com dados importantes.

## 6. Usar MySQL diretamente, sem Docker

1. Instale MySQL Server 8.4 e inicie o serviço.
2. Entre como administrador e execute o arquivo `server/sql/create_database_local.sql` (ou crie o banco `fitmanager` pelo MySQL Workbench).
3. Crie um usuário MySQL com permissões no banco ou use uma conta existente adequada.
4. Edite `server/.env`: `DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=fitmanager`, `DB_SSL=false`.
5. Execute `npm run db:init`, `npm run db:check`, `npm run dev`.

O script SQL de criação do esquema está em `server/sql/schema.sql`; o comando `db:init` o aplica de forma automática. Há detalhes e exemplos no documento `docs/BANCO_MYSQL.md`.

## 7. Cadastro dos três perfis

- **Aluno:** escolha Aluno, insira dados e senha. Opcionalmente digite o código do instrutor. Se não digitar, use **Meu Instrutor** após entrar.
- **Instrutor:** escolha Instrutor e crie a conta. O menu **Meu Código** exibe código que pode ser compartilhado com alunos.
- **Administrador:** escolha Administrador e forneça `ADMIN_SIGNUP_CODE` que o responsável técnico configurou exclusivamente no servidor; em produção, defina a variável no painel privado da hospedagem. O código não fica embutido no front-end ou no Git.

A escolha visual do perfil no login não concede privilégios. O perfil autenticado vem do MySQL e do JWT verificado pelo servidor.

## 8. Testar antes de entregar

```bash
npm run test           # testes unitários independentes do banco
npm run build          # precisa de dependências instaladas
npm run db:check       # precisa de MySQL ativo
npm run dev            # mantenha executando em outro terminal
npm run test:e2e       # COM O SERVIDOR DEV LIGADO; cria dados de teste no banco local
```

O `test:e2e` cria contas e registros no banco local e não deve ser executado contra produção. Consulte `docs/TESTES_FINAIS.md` para o checklist de demonstração.

## 9. Colocar na hospedagem

A forma mais simples é hospedar **React compilado + Express no mesmo domínio HTTPS**, com MySQL externo. O React não se conecta diretamente ao banco e o código da conexão não é exposto ao usuário. Há dois caminhos prontos:

- `render.yaml`: web service Node no Render; `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL` configurados no painel da hospedagem.
- `Dockerfile`: imagem com Express e front-end já compilado, adequada a plataformas que aceitem Docker.

Leia **`docs/PUBLICACAO_FINAL.md`** para um passo a passo detalhado, incluindo a configuração do banco remoto, código administrativo, e-mail real e testes pós-deploy. O ZIP prepara a publicação, **não cria um site público sozinho**.

## 10. Limitações transparentes

- Sem configuração de Resend/SMTP, o envio externo de recuperação de senha permanece indisponível; Mailpit é apenas para testes locais.
- Cadastro não verifica e-mail por link de confirmação; não use dados sensíveis sem testes, política de privacidade, gestão de backups e revisão de segurança.
- A exclusão permanente de alunos ainda remove fichas e históricos associados. Arquivar fichas, por outro lado, preserva as cargas.
- A compatibilidade com hospedagem depende das configurações reais do provedor, versão do MySQL e disponibilidade do serviço externo. O deploy não foi realizado a partir deste pacote.

**Documentação recomendada:** `docs/REQUISITOS_FINAIS.md`, `docs/BANCO_MYSQL.md`, `docs/PUBLICACAO_FINAL.md`, `docs/GUIA_APRESENTACAO_FINAL.md`, `docs/TESTES_FINAIS.md`.
