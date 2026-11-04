# FitManager — Instruções de avaliação (documento privado)

**Versão final 2.0 — Etapa 3 — Ciência da Computação, Unifor**

## Acesso ao sistema

- **Site da aplicação:** https://fitmanager-final.onrender.com/login
- **Repositório do código-fonte:** https://github.com/MarcosG66/fit-manager
- **Tecnologias:** React + Vite + Bootstrap (front-end), Node.js + Express (API), MySQL 8.4 (persistência), Render (hospedagem), Aiven (banco de dados).

## Cadastro de administrador para avaliação

O FitManager permite que alunos, instrutores e administradores criem contas. Para impedir a criação irrestrita de administradores, esse perfil exige um convite configurado na variável privada `ADMIN_SIGNUP_CODE` do servidor.

**Código administrativo fornecido pela equipe para a avaliação:**

```text
eaccbcc523fbd0117ead653982c774367af99ff4751aeb3468d875b9843fda4b
```

**Passos:**

1. Abra https://fitmanager-final.onrender.com/login.
2. Clique em **Criar conta**.
3. Escolha o perfil **Administrador**.
4. Informe nome, e-mail e uma senha de sua escolha.
5. Insira o código administrativo acima no campo de convite.
6. Finalize o cadastro e entre com e-mail e senha para acessar o painel administrativo.

O código é necessário apenas durante o cadastro; os próximos logins usam e-mail e senha. **O código informado precisa coincidir com o valor atual de `ADMIN_SIGNUP_CODE` no Render.** Se a equipe tiver alterado esse segredo após a elaboração deste documento, solicite o novo código ao responsável.

## Roteiro sugerido para a avaliação

1. **Aluno:** crie uma conta e explore a navegação, a área de treinos, o registro de cargas e as métricas.
2. **Instrutor:** crie uma conta, obtenha seu código de vínculo, associe o aluno e cadastre uma ficha com exercícios. Teste consulta, edição e arquivamento.
3. **Administrador:** crie a conta com o convite acima, acesse os indicadores e gerencie os usuários autorizados.
4. **Persistência:** atualize a página e confirme que os cadastros, fichas e cargas foram mantidos.
5. **API:** acesse https://fitmanager-final.onrender.com/api/health; a resposta esperada é `{"ok":true,"db":true}`.

**Observação:** o serviço gratuito do Render pode precisar de alguns instantes para responder ao primeiro acesso após inatividade. O envio de e-mails de recuperação na nuvem depende da configuração do provedor de e-mail externo.

## Executar localmente, se desejado

Pré-requisitos: Node.js 22 LTS, npm, Docker Desktop e Git.

```bash
git clone https://github.com/MarcosG66/fit-manager.git
cd fit-manager
npm run setup
npm install
npm run install:all
docker compose up -d --wait
npm run db:init
npm run db:check
npm run dev
```

A aplicação local abre em http://localhost:5173, a API em http://localhost:3001/api/health e o Mailpit em http://localhost:8025. **O `npm run setup` gera um código administrativo local aleatório, diferente do código do Render.** O código local fica em `CONTAS_LOCAIS.txt` ou em `server/.env` e pode ser usado no cadastro de administrador da instalação local.

Para testes automatizados locais:

```bash
npm run audit
npm run build
# Com o servidor npm run dev aberto em outro terminal e banco de desenvolvimento:
TEST_API_ORIGIN=http://127.0.0.1:3001 npm run test:e2e
```

**Nunca execute o teste E2E no banco remoto de produção:** ele cria dados de teste.

## Equipe

Cairo Forte Ferreira Filho · Henrique José Barbosa Vitalino Carneiro Mello · Marcos Gentili Oliveira · Valter Expedito Ribeiro da Silva

---

**Nota de segurança para a equipe:** este código concede acesso à criação de administradores enquanto permanecer ativo. Entregue este documento exclusivamente ao avaliador, monitore cadastros administrativos de teste e faça a rotação do valor `ADMIN_SIGNUP_CODE` no Render ao terminar a correção.
