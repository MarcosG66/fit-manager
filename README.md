# FitManager — Versão Final 2.0

**Sistema web para gerenciamento de academias e acompanhamento de treinos**  
Trabalho final de Desenvolvimento Web — Ciência da Computação, Universidade de Fortaleza (Unifor).

**Aplicação publicada:** https://fitmanager-final.onrender.com/login  
**Repositório:** https://github.com/MarcosG66/fit-manager

## Sobre o projeto

O FitManager centraliza o cadastro de alunos, a criação de fichas de treinamento e o acompanhamento da evolução física. A aplicação foi desenvolvida como sistema *full-stack*, com interface responsiva, API REST, autenticação e persistência em banco de dados relacional.

O sistema oferece **três perfis**, cada um com permissões próprias:

| Perfil | Principais recursos |
|---|---|
| **Aluno** | Consultar treinos; registrar cargas e conclusão de exercícios; acompanhar métricas, IMC e gráficos; vincular-se a instrutor por código; editar dados da conta. |
| **Instrutor** | Gerenciar alunos; gerar código de vínculo; criar, consultar, editar e arquivar fichas de treino; associar exercícios às fichas; acompanhar seus alunos. |
| **Administrador** | Visualizar indicadores e usuários; consultar e gerenciar contas; gerenciar catálogo de exercícios e status dos usuários. |

Todos os perfis podem se cadastrar e entrar com e-mail e senha. **O cadastro de administrador exige um código de convite**, armazenado somente nas variáveis privadas do servidor. O login não exige escolher manualmente o perfil: o servidor identifica e autoriza o usuário com base em seus dados.

## Tutorial integrado

A versão atual inclui um **tutorial de uso em `/tutorial`**, disponível sem login. A página possui instruções separadas para os perfis **aluno**, **instrutor** e **administrador**, além de dúvidas frequentes. O acesso está disponível na tela de autenticação e dentro dos painéis.

- Ambiente local: http://localhost:5173/tutorial
- Hospedagem, **após o próximo deploy**: https://fitmanager-final.onrender.com/tutorial
- Documentação técnica: [docs/TUTORIAL_DE_USO.md](docs/TUTORIAL_DE_USO.md)

### Publicar esta atualização na versão online

A rota `/tutorial` só ficará disponível no domínio público depois de atualizar o repositório e o Render concluir um novo deploy. No seu repositório Git existente, copie as alterações mantendo `.git` e `server/.env`, execute os testes e envie um novo commit:

```bash
npm run audit
npm run build
git status
git add -A
git commit -m "feat: tutorial de uso e relatorio final"
git push origin main
```

Depois do deploy, teste `https://fitmanager-final.onrender.com/tutorial` nos três perfis e sem autenticação. O banco MySQL e seus dados não precisam ser recriados para essa alteração.

## Tecnologias e arquitetura

| Camada | Tecnologias | Responsabilidade |
|---|---|---|
| Interface | React 19, Vite 6, JavaScript/JSX, Bootstrap 5, CSS, React Router | Navegação, formulários, dashboards e responsividade |
| API | Node.js, Express 4, JSON/HTTP | Regras de negócio, rotas REST e acesso ao banco |
| Segurança | bcrypt, JWT, cookie `httpOnly`, Helmet, express-rate-limit, Zod | Hash de senhas, sessões, proteção de rotas e validação |
| Dados | MySQL 8.4 e `mysql2` | Usuários, fichas, exercícios, avaliações e histórico |
| Desenvolvimento | Docker Compose e Mailpit | Banco local e captura dos e-mails de teste |
| Implantação | GitHub, Render, Aiven | Versionamento, execução da aplicação e MySQL na nuvem |

### Fluxo de funcionamento

```text
Navegador (React)
      |
      | HTTPS / requisições JSON em /api
      v
Node.js / Express (validação, autenticação, autorização)
      |
      | Consultas SQL parametrizadas / transações
      v
MySQL 8.4 (dados persistentes)
```

Em produção, o Express entrega os arquivos compilados do React no mesmo domínio; o navegador não acessa diretamente as credenciais ou o banco MySQL.

## Funcionalidades implementadas

- Cadastro e login para alunos, instrutores e administradores (este último com convite).
- Autenticação por JWT, senhas com hash bcrypt e restrições por perfil.
- Recuperação de senha com código numérico de oito dígitos, validade de 10 minutos e limitação de tentativas; envio depende de SMTP/Mailpit no desenvolvimento ou provedor externo em produção.
- Atualização de perfil e alteração de senha.
- Vínculo entre aluno e instrutor por código.
- CRUD de alunos, exercícios e fichas, respeitando permissões.
- Arquivamento de fichas e itens para conservar o histórico de cargas.
- Registro de cargas e conclusão de exercícios.
- Avaliações físicas, IMC e gráficos de evolução.
- Painel administrativo com consulta e gerenciamento de usuários.
- API com endpoints de saúde, scripts SQL, migrações e testes automatizados.

**Nota:** arquivar uma ficha preserva o histórico; a exclusão permanente de um aluno pode remover registros associados. A versão acadêmica ainda não possui verificação obrigatória de e-mail no cadastro nem garantia comercial de disponibilidade.

## Estrutura do projeto

```text
FitManager/
├── client/
│   ├── src/
│   │   ├── components/           # Componentes de interface e áreas aluno/instrutor
│   │   ├── pages/                # Autenticação, tutorial e dashboards
│   │   ├── contexts/             # Estado de autenticação
│   │   ├── hooks/                # Hooks reutilizáveis
│   │   ├── services/             # Requisições à API
│   │   └── styles/               # Estilos e Bootstrap
│   └── vite.config.js
├── server/
│   ├── src/config/db.js          # Conexão com MySQL
│   ├── src/middleware/auth.js    # Autenticação e autorização
│   ├── src/routes/              # Endpoints da API
│   ├── src/services/mail.js      # Serviço de e-mail
│   ├── sql/schema.sql            # Definição das 11 tabelas
│   ├── sql/create_database_local.sql
│   ├── scripts/                 # Inicialização, migração e testes E2E
│   └── tests/                   # Testes unitários
├── docs/                         # Documentação complementar
├── scripts/setup-dev.mjs        # Configuração inicial local
├── docker-compose.yml           # MySQL + Mailpit
├── Dockerfile                   # Contêiner para implantação
├── render.yaml                  # Infraestrutura no Render
└── package.json
```

## Instalação local — passo a passo

### Pré-requisitos

- **Node.js 22 LTS** e npm (ou versão compatível com o projeto).
- **Docker Desktop** com Docker Engine em execução; alternativamente, MySQL 8.4 instalado localmente.
- Git (opcional, para clonar o repositório) e editor como VS Code.

### 1. Obter o código

```bash
git clone https://github.com/MarcosG66/fit-manager.git
cd fit-manager
```

Também é possível baixar o ZIP do repositório e abrir a pasta extraída.

### 2. Configurar o ambiente e instalar dependências

```bash
npm run setup
npm install
npm run install:all
```

`npm run setup` cria `server/.env`, `client/.env` e `CONTAS_LOCAIS.txt` quando necessário. **Preserve esses arquivos e não os inclua no Git.** Se já existirem, o configurador preserva as configurações.

### 3. Iniciar o MySQL e o servidor de e-mails local

Abra o Docker Desktop e execute, na raiz do repositório:

```bash
docker compose up -d --wait
docker compose ps
```

Serviços locais padrão:

| Serviço | Endereço |
|---|---|
| MySQL | `127.0.0.1:3307` |
| Mailpit (visualizar e-mails de teste) | http://localhost:8025 |

O banco é persistido em volume Docker. **Não use `docker compose down -v` se desejar preservar seus dados.** Para desligar mantendo o volume, utilize `docker compose down`.

### 4. Criar o esquema SQL e conferir a conexão

```bash
npm run db:init
npm run db:check
```

`db:init` cria as tabelas definidas em `server/sql/schema.sql` e aplica migrações pertinentes. O projeto utiliza **11 tabelas**: `usuario`, `aluno`, `instrutor`, `grupo_muscular`, `exercicio`, `ficha_treino`, `item_ficha`, `historico_carga`, `conclusao_exercicio`, `avaliacao_fisica` e `redefinicao_senha`.

**Opcional, somente para demonstração local:**

```bash
npm run db:seed
```

As credenciais do *seed* local são geradas e registradas em `CONTAS_LOCAIS.txt`. Evite executar o *seed* no banco de produção.

### 5. Iniciar a aplicação

```bash
npm run dev
```

| Endereço | Descrição |
|---|---|
| http://localhost:5173 | Interface React |
| http://localhost:3001/api/health | Saúde da API e conexão MySQL |
| http://localhost:8025 | E-mails de recuperação no Mailpit |

A resposta esperada da API é `{"ok":true,"db":true}`. Mantenha o terminal de desenvolvimento aberto durante o uso.

### Usar um MySQL instalado no computador (sem Docker)

Execute `server/sql/create_database_local.sql` com um usuário autorizado, ajuste `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` e `DB_SSL=false` em `server/.env`, e então execute `npm run db:init`, `npm run db:check` e `npm run dev`. Para instruções de banco e backups, consulte `docs/BANCO_MYSQL.md`.

## Como testar os três perfis

1. Abra a aplicação publicada ou a instalação local e acesse **Criar conta**.
2. Cadastre um **instrutor**; no painel, obtenha o código de vínculo.
3. Cadastre um **aluno**; use o código para vincular-se ao instrutor.
4. Com o instrutor, crie uma ficha e associe exercícios.
5. Com o aluno, consulte a ficha, registre uma carga e marque um exercício como concluído.
6. Volte à aplicação e verifique se o histórico foi preservado.
7. Para cadastrar um **administrador**, solicite o código de convite ao responsável pela entrega ou consulte as **instruções privadas de avaliação** encaminhadas ao professor. **Esse código não é publicado no GitHub.**

O vínculo aluno–instrutor e as funções de administração exigem as permissões previstas no servidor. O cadastro de administrador deve ser realizado apenas para a avaliação autorizada.

## Testes e verificação da entrega

```bash
npm run audit              # Auditoria estática + testes unitários
npm audit --prefix server  # Dependências da API
npm run build              # Compilação de produção
npm run db:check           # Banco configurado e acessível
```

Para os testes integrados, mantenha `npm run dev` executando em um terminal e, em outro **Git Bash**, execute:

```bash
TEST_API_ORIGIN=http://127.0.0.1:3001 npm run test:e2e
```

**Execute o E2E somente em um banco de desenvolvimento**: ele cria contas e dados de teste. O uso explícito de `127.0.0.1` evita possíveis diferenças de resolução de `localhost`/IPv6 em algumas instalações do Windows.

### Resultados verificados na validação local da equipe (03/11/2026)

- `npm audit --prefix server`: **0 vulnerabilidades conhecidas reportadas**.
- `npm run audit`: **aprovado**, com 32 arquivos JS/MJS, 158 imports e 11 tabelas verificados.
- Testes unitários: **12 de 12 aprovados**.
- `npm run build`: **aprovado**, 490 módulos processados; aviso não bloqueante de *bundle* acima de 500 KB.
- MySQL local 8.4.13 e MySQL remoto Aiven 8.4.11: conexão e 11 tabelas verificadas.
- Teste E2E com IPv4: **aprovado** para banco, cadastro, login inválido, vínculo, fichas, cargas, arquivamento, histórico e permissões.
- Aplicação hospedada no Render e conectada à Aiven, com teste funcional informado pela equipe.

Estes são resultados da execução relatada pela equipe, não uma promessa de disponibilidade permanente ou de ausência de falhas futuras.

## Publicação na nuvem

A implantação acadêmica utiliza:

- **GitHub** — código-fonte e histórico de alterações;
- **Render** — hospedagem da aplicação React compilada e API Express sob o mesmo domínio HTTPS;
- **Aiven for MySQL** — banco relacional remoto com conexão TLS.

O arquivo `render.yaml` define o serviço web; `Dockerfile` oferece implantação alternativa em plataforma compatível com contêineres. As variáveis `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`, `DB_SSL_CA`, `JWT_SECRET`, `RESET_SECRET` e `ADMIN_SIGNUP_CODE` são configuradas no servidor, **nunca no front-end ou no Git**.

O banco pode ser inicializado pelos scripts do repositório (`npm run db:init`) e as atualizações de esquema devem ser feitas com backup e controle. Para a implantação detalhada, veja `docs/PUBLICACAO_FINAL.md`.

A recuperação de senha na nuvem exige um serviço de e-mail real configurado (por exemplo, Resend); o Mailpit é exclusivo do ambiente local. A hospedagem gratuita pode hibernar após inatividade, causando demora no primeiro acesso.

## Equipe

- Cairo Forte Ferreira Filho
- Henrique José Barbosa Vitalino Carneiro Mello
- Marcos Gentili Oliveira
- Valter Expedito Ribeiro da Silva

**Universidade de Fortaleza (Unifor) — Ciência da Computação.**

## Documentação complementar

Consulte os arquivos em `docs/`: `REQUISITOS_FINAIS.md`, `BANCO_MYSQL.md`, `PUBLICACAO_FINAL.md`, `GUIA_APRESENTACAO_FINAL.md`, `TESTES_FINAIS.md` e `AUDITORIA_PRE_PUBLICACAO.md`.

> **Segurança:** este README é público e não contém senhas ou códigos de administrador. As informações privadas para o avaliador devem ser entregues separadamente pelo AVA, e o código administrativo deve ser revogado ou alterado após a avaliação.
