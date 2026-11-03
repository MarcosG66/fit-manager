# Publicar FitManager gratuitamente (Render + Aiven MySQL)

## Arquitetura

- **Render Web Service Free:** executa Express e serve o build React no mesmo domínio HTTPS, preservando cookies `SameSite=Strict`.
- **Aiven for MySQL Free:** banco de dados **MySQL Server real**, com 1 GB de armazenamento gratuito (sujeito aos limites do plano). Assim, não é preciso substituir o MySQL do plano de trabalho por um banco apenas compatível.
- **Docker:** não é necessário na hospedagem; permanece opcional para desenvolver localmente.
- **E-mail:** Mailpit não existe no Render. O projeto oferece suporte opcional ao Resend via HTTPS, com remetente autorizado. Sem configurar, recuperação de senha não envia código (HTTP 503).

## 1. Criar o MySQL gratuito na Aiven

1. Acesse https://console.aiven.io/ e crie uma conta.
2. Crie um serviço **MySQL**, selecionando o plano **Free** (não o trial pago). Escolha MySQL 8.4 se essa versão estiver disponível.
3. Aguarde o serviço ficar **Running**. No painel do serviço, em **Databases**, crie um banco chamado `fitmanager` (ou use `defaultdb` e configure `DB_NAME=defaultdb`).
4. Em **Overview / Connection information**, anote `Host`, `Port`, `User`, `Password` e `Database`. **Não envie a senha para o chat e não inclua essas informações no repositório.**
5. Na mesma área, baixe o **CA Certificate** e abra-o como texto. O conteúdo PEM completo (incluindo `-----BEGIN CERTIFICATE-----` e `-----END CERTIFICATE-----`) será a variável secreta `DB_SSL_CA` no Render. A conexão usa TLS com verificação de certificado, sem `rejectUnauthorized:false`.

## 2. Subir o código ao GitHub

1. Extraia o ZIP e abra a pasta `FitManager-MVP-Publicacao-Gratuita`.
2. Crie um repositório privado no GitHub, por exemplo `fitmanager-mvp`.
3. No terminal da pasta, execute:

   ```bash
   git init
   git add .
   git commit -m "Preparar publicação do FitManager"
   git branch -M main
   git remote add origin URL_DO_REPOSITORIO
   git push -u origin main
   ```

4. Confira que **não foram publicados** `server/.env`, `client/.env`, `CONTAS_LOCAIS.txt`, senhas ou certificados. `.gitignore` já exclui os arquivos `.env`.

## 3. Criar o Web Service gratuito no Render

1. Acesse https://dashboard.render.com/ e conecte o GitHub.
2. Use **New > Blueprint** apontando para o repositório, pois há um `render.yaml` na raiz. Escolha **Free**; confirme que não há serviços pagos.
3. Preencha as variáveis marcadas `sync:false` com os dados da Aiven:

   | Variável | Valor |
   | --- | --- |
   | `DB_HOST` | Host exibido na Aiven |
   | `DB_PORT` | Porta exibida na Aiven (não suponha 3306) |
   | `DB_USER` | Usuário da Aiven |
   | `DB_PASSWORD` | Senha da Aiven (secreta) |
   | `DB_NAME` | `fitmanager` ou `defaultdb`, conforme criado |
   | `DB_SSL_CA` | Texto PEM completo do CA Certificate da Aiven |

4. `NODE_ENV=production`, `DB_SSL=true`, `DB_AUTO_INIT=true`, `DEMO_SEED=false` e os segredos JWT já estão definidos no `render.yaml`. O Render deve gerar valores aleatórios para `JWT_SECRET` e `RESET_SECRET`.
5. Aguarde a compilação e a inicialização. A URL real será exibida no painel como `https://NOME.onrender.com`.
6. Teste `https://NOME.onrender.com/api/health`: o resultado esperado é `{"ok":true,"db":true}`. Depois teste cadastro/login/dashboard.

### Se criar um Web Service manual (sem Blueprint)

- **Root Directory:** vazio (raiz do repositório).
- **Build:** `npm install --prefix server && npm install --prefix client --include=dev && npm run build --prefix client`
- **Start:** `npm run start:cloud --prefix server`
- **Health Check Path:** `/api/health`
- **Instance:** Free.
- **Environment:** todas as variáveis acima, `NODE_ENV=production`, `DB_SSL=true`, `DB_AUTO_INIT=true`, `JWT_SECRET` e `RESET_SECRET` com valores diferentes e aleatórios de 32+ caracteres.

`DB_AUTO_INIT=true` executa `CREATE TABLE IF NOT EXISTS` ao iniciar o processo. É uma conveniência do MVP, **não** um sistema de migrações de produção. Se o banco não conectar, o serviço falha no deploy e os logs mostram o erro.

## 4. Criar contas de demonstração (opcional)

O script `server/scripts/seed.js` insere aluno, instrutor e admin fictícios. Para executar **uma vez**:

1. Nas variáveis privadas do Render, defina `SEED_STUDENT_PASSWORD`, `SEED_INSTRUCTOR_PASSWORD`, `SEED_ADMIN_PASSWORD` com três senhas fortes diferentes (8+ caracteres) e `DEMO_SEED=true`.
2. Redeploy. O script só cria usuários que não existem e adiciona catálogo e ficha de exemplo.
3. **Depois do deploy bem-sucedido, volte `DEMO_SEED=false` e remova as variáveis de senha do Render.** Guarde as senhas fora do GitHub.
4. Usuários de demonstração: `ana@email.com` (aluno), `carlos@academia.com` (instrutor), `admin@academia.com` (admin).

## 5. Recuperação de senha com código de 8 dígitos

- O Render Free bloqueia portas SMTP 25, 465 e 587. Esta versão suporta **Resend via HTTPS** com `RESEND_API_KEY` e `RESEND_FROM` nas variáveis privadas do Render.
- Siga as exigências de verificação do remetente do Resend. O remetente de teste pode permitir envio apenas para o e-mail da própria conta; para terceiros normalmente é necessário verificar um domínio.
- Sem provedor de e-mail, o fluxo de recuperação retorna indisponível (503). Não declare que e-mails reais estão funcionando até testar.

## 6. Limitações e segurança

- Render Free dorme após 15 minutos sem tráfego; o primeiro acesso pode levar cerca de um minuto.
- Não use dados pessoais reais: é um MVP acadêmico. A autorização e os fluxos de autenticação ainda precisam de testes ponta a ponta.
- Não publique credenciais de demonstração no repositório ou use senhas locais em um serviço público.
- O banco Aiven Free pode ser pausado por inatividade; confirme que está **Running** antes da apresentação.
- Não há garantia de que o nome `fitmanager-mvp.onrender.com` esteja disponível; a URL real depende da conta e do serviço criado.
- **Este ZIP prepara o projeto para deploy; a publicação efetiva depende de contas e autorizações no GitHub, Render e Aiven.**

## Documentação dos serviços

- https://render.com/docs/free
- https://render.com/docs/deploy-node-express-app
- https://aiven.io/docs/products/mysql/concepts/mysql-free-tier
- https://aiven.io/docs/products/mysql/howto/create-database
- https://aiven.io/docs/platform/concepts/tls-ssl-certificates
