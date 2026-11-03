# Publicação final — hospedagem do FitManager

## Arquitetura online

```
Navegador (HTTPS)
      ↓
React compilado (arquivos estáticos servidos pelo Express)
      ↓ /api (JSON, mesmo domínio)
Node.js + Express (JWT, bcrypt, Zod e autorização)
      ↓ conexão TCP/TLS
MySQL em serviço gerenciado
```

**Docker local não precisa permanecer ligado.** `render.yaml` publica web + API no mesmo Render Web Service; o banco é contratado/criado separadamente. `Dockerfile` é uma alternativa para plataformas que executem contêineres.

## 1. Preparar banco MySQL remoto

Escolha um serviço de **MySQL real** que permita acesso remoto à aplicação hospedada. Alguns provedores oferecem cota gratuita ou avaliação, sujeitos a mudanças. Crie um banco `fitmanager`, guarde `host`, `port`, `user`, `password` e o certificado CA se necessário. Permita conexão da sua hospedagem e use TLS. O arquivo `server/sql/schema.sql` contém o esquema; se a hospedagem definir `DB_AUTO_INIT=true`, ele será aplicado na primeira inicialização.

Se o provedor não disponibilizar um banco chamado `fitmanager`, utilize outro nome disponível e configure `DB_NAME` para esse nome. **Não deixe credenciais no GitHub.**

## 2. Versionar o projeto

Crie um repositório privado no GitHub:

```bash
git init
git add .
git commit -m "FitManager — versão final"
git branch -M main
git remote add origin URL_DO_REPOSITORIO
git push -u origin main
```

Verifique antes do push que os arquivos `server/.env`, `client/.env`, `CONTAS_LOCAIS.txt` e qualquer `*.sql` de backup **não estão incluídos** (o `.gitignore` já protege os principais segredos).

## 3. Hospedar no Render

1. Entre no painel do Render e conecte o repositório.
2. Crie um **Blueprint** que leia `render.yaml` (ou Web Service Node manual, raiz do repositório).
3. Configure os valores obrigatórios nas **Environment Variables**, sem copiá-los para o código:

| Variável | Exemplo/observação |
|---|---|
| `NODE_ENV` | `production` |
| `DB_HOST` | Host do serviço MySQL remoto |
| `DB_PORT` | Porta fornecida pelo provedor |
| `DB_USER` | Nome do usuário do banco |
| `DB_PASSWORD` | Segredo do banco, privado |
| `DB_NAME` | `fitmanager` ou banco disponibilizado |
| `DB_SSL` | `true` quando houver TLS |
| `DB_SSL_CA` | Certificado CA PEM do provedor, se exigido |
| `JWT_SECRET` | Valor aleatório **>=32 caracteres**; Render pode gerá-lo |
| `RESET_SECRET` | Outro valor aleatório **>=32 caracteres**, diferente do JWT |
| `ADMIN_SIGNUP_CODE` | **Código secreto >=24 caracteres**, criado pelo responsável técnico |
| `DB_AUTO_INIT` | `true` somente para inicialização / atualização programada |
| `DEMO_SEED` | `false` (não criar contas fictícias em produção) |

O Blueprint usa:

```text
Build: npm install --prefix server && npm install --prefix client --include=dev && npm run build --prefix client
Start: npm run start:cloud --prefix server
Health: /api/health
```

O React é compilado em `client/dist` e servido pelo Express. No mesmo domínio HTTPS, os cookies de sessão funcionam com `SameSite=Strict`, sem depender de armazenamento de JWT em localStorage.

4. No primeiro deploy, `DB_AUTO_INIT=true` cria/aplica o esquema e as migrações antes de iniciar a API. Depois que o deploy funcionar, pode configurar `DB_AUTO_INIT=false` para não executar DDL a cada reinício. Em novas versões, rode as migrações explicitamente.
5. Confira o domínio **real** fornecido pelo Render (por exemplo, `https://nome-disponivel.onrender.com`, sujeito à disponibilidade).
6. Teste primeiro `/api/health`, depois cadastro dos três perfis, vínculo, fichas, avaliação, histórico e encerramento de sessão.

**Se a hospedagem oferecer apenas plano pago no momento da publicação, escolha outro plano ou provedor — o arquivo não garante que a opção Free estará disponível.**

## 4. Recuperação de senha em ambiente público

O Mailpit do Docker é apenas local. Para e-mails reais configure **um provedor de e-mail**. O projeto suporta:

- **Resend via HTTPS:** `RESEND_API_KEY` e `RESEND_FROM` (remetente/domínio verificado, sujeito às condições do provedor). Adequado quando a hospedagem limita SMTP.
- **SMTP:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE` e `MAIL_FROM`, caso o provedor de hospedagem permita acesso SMTP.

Sem configuração válida, a recuperação responde com erro de serviço indisponível; não é possível enviar código real usando somente o Render.

## 5. Segurança antes de demonstrar publicamente

- Crie `ADMIN_SIGNUP_CODE` longo e aleatório; entregue-o somente às pessoas autorizadas e **não exponha o valor no front-end**.
- Não publique senhas das contas fictícias e não execute o seed de demonstração em banco real.
- Confirme que `JWT_SECRET` e `RESET_SECRET` são diferentes, aleatórios e privados.
- Evite logs com senha e segredos. Não envie credenciais à conversa nem a arquivos de documentação.
- Configure backups, atualização de dependências, monitoramento e retenção de dados antes de uso comercial.
- Cadastros não exigem verificação de e-mail; para uso real, considere confirmar o e-mail e aprovar novos instrutores.

## 6. Publicação alternativa por Dockerfile

```bash
docker build -t fitmanager-final .
```

A imagem resultante executa **o Express e serve o React compilado**, mas depende de um servidor MySQL externo (ou um segundo contêiner). Informe as mesmas variáveis de ambiente pelo painel do provedor/container runtime. Nunca inclua `.env` no build.

## 7. Problemas comuns

| Sintoma | Possível causa |
|---|---|
| `/api/health` retorna 500 | MySQL não acessível, nome de banco errado ou TLS/CA incorretos |
| `JWT_SECRET/RESET_SECRET` inválido | Variáveis ausentes ou menores que 32 caracteres |
| `index.html` não encontrado | Build React não executado antes do start |
| Admin não consegue se cadastrar | `ADMIN_SIGNUP_CODE` não configurado no serviço ou informado incorretamente |
| Recuperação retorna 503 | Resend/SMTP não configurado |
| Banco vazio | `DB_AUTO_INIT` desligado antes da criação inicial; executar `db:init` |
| Requisições 403 com origem inesperada | Domínio real difere de `CLIENT_ORIGIN` configurado |

A configuração está preparada para hospedagem, mas **a publicação depende de você conectar contas, configurar segredos e testar o provedor de banco escolhido**.
