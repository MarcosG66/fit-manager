# Revisão de legibilidade — FitManager

## O que foi alterado

- Arquivos JavaScript/JSX foram reorganizados com indentação consistente e quebras de linha.
- Os dashboards do aluno e do instrutor foram separados de seus conteúdos específicos.
- `client/src/App.jsx` explicita páginas públicas, páginas privadas e redirecionamentos por perfil.
- `client/src/services/api.js` documenta a comunicação HTTP, JSON e cookies.
- `client/src/contexts/AuthContext.jsx` explicita restauração de sessão, login, cadastro e logout.
- `server/src/routes/auth.js` usa schemas, nomes explicativos, funções auxiliares e comentários sobre recuperação de senha, HMAC, hash bcrypt e JWT.
- `server/src/middleware/auth.js` documenta a validação do token e as permissões.
- `server/src/config/db.js` explica pool de conexões e transações.
- `server/src/utils/access.js` documenta regras de acesso aos dados de alunos, fichas e exercícios.
- `client/src/components/CardExercicio.jsx` e `client/src/components/FormFicha.jsx` foram reorganizados, com ações de formulário mais fáceis de acompanhar.
- O CSS passou de declarações compactadas para regras separadas, mantendo os seletores e valores originais.
- Foram adicionados EditorConfig, Prettier, configuração do VS Code e guia para apresentação do código.

## O que não foi alterado intencionalmente

- Tecnologias: React, Vite, Bootstrap, Node.js, Express, MySQL.
- Modelo do banco (`server/sql/schema.sql`).
- Contratos da API (caminhos de rotas, métodos e nomes de campos enviados).
- Configuração do Docker e do Render.
- Identidade visual baseada no Figma e imagens usadas no projeto.

## Validação realizada

- 49 arquivos `.js`, `.mjs` e `.jsx` analisados com parser JavaScript/JSX do TypeScript.
- 128 imports locais analisados e resolvidos.
- Arquivos JavaScript verificados com `node --check`.
- CSS analisado com PostCSS; seletores, declarações, valores e regras preservados durante a formatação.
- Não houve instalação de dependências, testes com MySQL ou build completo neste ambiente.

## Verificação na máquina do desenvolvedor

Depois de instalar as dependências, executar:

```bash
npm run format
npm run format:check
npm run build
npm run db:init --prefix server
npm run dev
```

Também executar os testes manuais em `docs/TESTES_MANUAIS.md`, principalmente login, redefinição de senha, autorização e CRUD das fichas.
