# Guia para apresentar o código da versão final

## Demonstração de 10 a 15 minutos

1. **Problema (1 min):** planilhas e fichas de papel são difíceis de manter. O FitManager separa aluno, instrutor e administrador.
2. **Tecnologias (2 min):** React/Vite/Bootstrap na apresentação; API Express/Node no processamento; MySQL relacional na persistência. Docker só fornece MySQL e Mailpit no desenvolvimento. Na hospedagem, Express serve também o React compilado.
3. **Estrutura (2 min):** abra `client/src/App.jsx` (rotas protegidas); `components/CardExercicio.jsx` (reutilização), `services/api.js` (fetch e JSON), `server/src/index.js` (rotas/middlewares).
4. **Banco e segurança (2 min):** abra `server/sql/schema.sql` (FKs, UNIQUE), `server/src/routes/auth.js` (bcrypt, código de admin, código de recuperação), `server/src/middleware/auth.js` (JWT em cookie HTTP-only, token_version) e `server/src/config/db.js` (pool, query parametrizada, transações).
5. **Fluxo integrado (4 min):** criar conta de instrutor, copiar código, criar conta de aluno com esse código, criar ficha, abrir como aluno e registrar carga, visualizar histórico de evolução; mostrar busca e controle de contas no admin.
6. **Publicação (1 min):** mostrar `render.yaml`, `Dockerfile`, `.env.example` e `/api/health`. Credenciais não vão para o front-end nem ao Git.
7. **Conclusão e limites (1 min):** todas as funcionalidades do plano têm implementação, com scripts de migração e testes; testes em ambiente real, e-mail de produção e implantação requerem credenciais e verificações externas.

## Como uma requisição percorre as camadas

```text
Aluno digita 32,5 kg no CardExercicio
    → client/src/services/api.js: POST /api/cargas (JSON)
    → server/src/index.js: middlewares
    → server/src/middleware/auth.js: verifica JWT
    → server/src/routes/cargas.js: valida com Zod
    → server/src/utils/access.js: confirma propriedade da ficha
    → server/src/config/db.js: query parametrizada MySQL
    → historico_carga: INSERT
    → Express: status 201 com JSON
    → React: atualiza tela/histórico
```

## Explicações para perguntas comuns

**Por que Node.js + Express?** O Node executa JavaScript no servidor. O Express organiza rotas, middlewares, validações e tratamento de respostas HTTP.

**Por que Vite?** É a ferramenta de desenvolvimento e build do React, não o back-end nem o banco. No deploy, o Express entrega os arquivos estáticos produzidos pelo Vite.

**Por que MySQL?** Relacionamentos de usuários, instrutores, alunos, fichas, exercícios e avaliações exigem integridade referencial, PKs/FKs e transações.

**Qual diferença entre autenticação e autorização?** Autenticação verifica quem é o usuário. Autorização decide o que o usuário pode fazer, primeiro por papel e depois pela propriedade dos dados.

**Onde fica o JWT?** Num cookie `httpOnly`, enviado automaticamente pelo navegador. O React não precisa acessar a string do token, e as rotas protegidas verificam a assinatura e a versão no banco.

**O que faz `bcrypt`?** Cria hash com salt e fator de custo, não criptografia reversível. Login compara a senha enviada contra o hash guardado.

**Como funciona a recuperação?** Código aleatório de 8 dígitos, armazenado como HMAC, expira em 10 minutos e possui limite de tentativas. A confirmação altera o hash da senha e invalida tokens antigos.

**Como um aluno encontra seu instrutor?** Instrutor possui código único de 12 dígitos hexadecimais, aluno informa esse código no cadastro ou no painel. A API valida e registra `aluno.instrutor_id`.

**Por que usar transações?** Evita cadastros parciais de usuário/aluno ou fichas incompletas. Falhas acionam rollback.

**O que acontece ao arquivar uma ficha?** Ela deixa de ser exibida para execução, mas os itens e o histórico de cargas ficam no banco para gráficos e auditoria. O arquivamento é reversível via banco e pode evoluir para recurso de UI.

**Por que Docker?** É conveniente para executar MySQL e Mailpit localmente com configuração reproduzível, sem que seja obrigatório na hospedagem.

**É seguro em produção?** O código incorpora controles importantes, mas segurança exige configuração de HTTPS/TLS, gestão de segredos, dependências atualizadas, testes de permissões, políticas de dados, backups e monitoramento. Não afirme que passou por auditoria de segurança.
