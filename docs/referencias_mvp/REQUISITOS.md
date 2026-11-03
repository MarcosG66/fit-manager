# FitManager — rastreabilidade ao plano de trabalho (Etapa 1)

O escopo segue a seção **5 — Requisitos do Sistema** e as seções **7 — Modelo de Dados** e **8 — Arquitetura** do PDF fornecido. O protótipo Figma Make foi usado como referência visual para login, dashboards e cards. O código gerado não copia as telas monolíticas do Figma: reorganiza o comportamento em componentes e páginas React e substitui os mocks por MySQL/Express.

| Código | Atendimento no MVP | Referências no código |
| --- | --- | --- |
| RF01 | CRUD de alunos por instrutor, busca, filtro ativo/inativo, ativação e exclusão. Cadastro público de aluno/instrutor também implementado. | `server/src/routes/alunos.js`, `auth.js`; `FormAluno`, `InstructorDashboard` |
| RF02 | Login seguro, JWT e redirecionamento por perfil real. | `routes/auth.js`, `middleware/auth.js`, `AuthContext`, `App.jsx` |
| RF03 | CRUD de ficha e de itens, vinculado ao instrutor e aluno. | `routes/fichas.js`, `FormFicha` |
| RF04 | CRUD de exercícios e grupos musculares. | `routes/catalogo.js`, `CatalogoExercicios` |
| RF05 | Fichas visíveis ao aluno, salva cargas em kg no histórico. | `routes/fichas.js`, `cargas.js`, `CardExercicio` |
| RF06 | Marcação diária de conclusão persistida; barra de progresso do treino. | `routes/cargas.js`, `conclusao_exercicio`, `StudentDashboard` |
| RF07 | Cadastro de peso/altura; cálculo de IMC em consulta, sem persistir IMC; histórico de avaliações. | `routes/avaliacoes.js`, `StudentDashboard` |
| RF08 | Gráfico de carga máxima por semana para cada exercício. | `routes/cargas.js`, `StudentDashboard` com Recharts |
| RF09 | Consulta, busca e totais por perfil no painel admin. | `routes/usuarios.js`, `AdminDashboard` |
| RF10 | Logout, remoção do cookie e retorno à tela de login. | `routes/auth.js`, `AuthContext`, `BarraLateral` |
| RNF01 | Responsividade em Bootstrap com CSS adicional; foco mobile no painel aluno. | `client/src/styles/global.css`, componentes e páginas |
| RNF02 | Hash bcrypt com 12 rounds e nenhum retorno de hash/senha na API. | `routes/auth.js`, `routes/alunos.js`, `scripts/seed.js` |
| RNF03 | API REST JSON para todas as trocas front-end/back-end. | `server/src/index.js`, `client/src/services/api.js` |
| RNF04 | Cards claros, campos de carga em destaque, feedback de salvar e navegação simples. | `CardExercicio`, `BarraNavegacao`, layouts |
| RNF05 | Middleware de perfil e verificação de vínculo/posse de aluno, ficha e item; rotas React protegidas para UX. | `middleware/auth.js`, `utils/access.js`, `App.jsx` |

## Requisitos extras solicitados nesta conversa

| Necessidade | Atendida como |
| --- | --- |
| Criar conta | `/api/auth/register` e `/cadastro`; sem autoatribuição de papel admin |
| Esqueci a senha | `/api/auth/forgot-password` e `/esqueci-senha` |
| Redefinir com código de 8 dígitos por e-mail | SMTP Nodemailer + MySQL HMAC; 10 min de validade, 5 tentativas; `/redefinir-senha` |
| Tokens de login | JWT com assinatura HS256, cookie httpOnly, SameSite Strict; validação em backend |
| Separar componentes e páginas | `client/src/components/`, `client/src/pages/` |
| React + Vite + Express + MySQL + Bootstrap | `client/`, `server/`, `docker-compose.yml` |

## O que difere do protótipo Figma

- O Figma armazenava dados **estáticos** em `src/data/mockData.ts` e autenticava comparando senhas no navegador. Isso não foi copiado para o produto final porque violaria RNF02/RNF03.
- Em vez de Tailwind, a implementação utiliza **Bootstrap 5 + CSS customizado**, mantendo o layout azul, os cartões arredondados e os principais fluxos de navegação.
- Os componentes foram separados das páginas em módulos menores e reutilizáveis.
- O plano não tinha recuperação de senha, token de recuperação nem conclusão por dia no MER; foram acrescentadas as tabelas técnicas `redefinicao_senha` e `conclusao_exercicio`, sem alterar as **nove** entidades originais.

## Limitações conscientes

O modelo fornecido não contém academia, organização ou convite entre professor e aluno, portanto **não** se afirma haver multi-tenancy. O registro público de aluno cria um aluno ainda sem instrutor; o instrutor só visualiza alunos vinculados. Criar vínculo ou fluxo de convite é evolução posterior. A exclusão física de fichas e exercícios pode destruir histórico associado; no MVP a UI pede confirmação e o banco preserva integridade relacional.
