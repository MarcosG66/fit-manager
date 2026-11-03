# FitManager — Auditoria técnica antes da publicação

**Base:** FitManager — Versão Final 2.0 (React 19 + Vite 6, Express 4, MySQL 8, Node 22).  
**Escopo:** revisão do código-fonte, fluxos de autenticação, banco, interface e arquivos de implantação, preservando a arquitetura e os endpoints existentes.  
**Resultado:** versão revisada com correções pontuais e testes adicionais; **não equivale a certificação de produção**.

## 1. Resumo executivo

O projeto mantém os três perfis (aluno, instrutor e administrador), CRUD de alunos, fichas e catálogo, avaliações, cargas, histórico, associação de contas, recuperação por e-mail, scripts MySQL e deploy preparado via `render.yaml`/`Dockerfile`.

As áreas que exigiram ajustes mais relevantes foram: login com escolhas visuais sem efeito; ordenação incorreta do envio de códigos de recuperação; possíveis respostas atrasadas sobrescrevendo dados de outro aluno; avisos incoerentes sobre exclusão de fichas; carregamentos infinitos em caso de erro; bloqueio concorrente de administradores; tratamento de indisponibilidade do banco; e navegação para o aluno escolhido.

## 2. Alterações aplicadas

| Prioridade | Problema encontrado | Arquivos | Ajuste |
|---|---|---|---|
| Alta | Opções de aluno/instrutor/admin no login não alteravam a autenticação | `client/src/pages/LoginPage.jsx`, `styles/global.css` | Removidas; perfil é devolvido pela API, com redirecionamento adequado |
| Alta | E-mail de recuperação era enviado **antes** de gravar o código | `server/src/routes/auth.js`, `utils/recovery.js` | Código persistido primeiro; envio depois; se falhar, o registro novo é removido |
| Alta | Limites de login, cadastro e troca de senha compartilhavam a mesma cota no pacote original | `server/src/routes/auth.js` | Aplicada a melhoria solicitada anteriormente: limitadores separados e `skipSuccessfulRequests` em login/alteração de senha |
| Alta | Falhas do MySQL eram exibidas como erro interno genérico | `server/src/utils/http.js` | Falhas de conexão típicas retornam HTTP 503 com mensagem operacional segura |
| Alta | Duas desativações simultâneas poderiam deixar zero administradores ativos | `server/src/routes/usuarios.js` | Bloqueio transacional das linhas administrativas antes da desativação |
| Média | Requisição antiga de outro aluno podia sobrescrever a lista atual | `client/src/hooks/useResource.js` | Identificação de requisição e descarte de respostas obsoletas; limpa dados no erro |
| Média | UI dizia que arquivar ficha apagaria o histórico | `client/src/components/instrutor/GestaoTreinos.jsx` | Textos e botão informam arquivamento, com preservação do histórico |
| Média | Botão de ficha na linha de um aluno abria treinos sem selecionar o aluno | `ListaAlunos.jsx`, `InstructorDashboard.jsx`, `GestaoTreinos.jsx` | Passagem do ID selecionado para a tela de treinos |
| Média | Consultar um aluno inexistente podia devolver HTTP 200 sem dados | `server/src/routes/alunos.js` | HTTP 404 explícito |
| Média | Perfil/vínculo poderiam ficar indefinidamente no indicador de carregamento | `MinhaConta.jsx`, `VinculoInstrutor.jsx` | Feedback de erro e botão de tentar novamente |
| Baixa | Listagem de alunos não exibia erro de carregamento no painel de instrutor | `InstructorDashboard.jsx` | Feedback de erro visível |
| Baixa | Seleção do dia de treino dependia do fuso do navegador | `TreinosAluno.jsx`, `utils/format.js` | Fuso configurável `VITE_APP_TIMEZONE`, padrão `America/Fortaleza` |

**Observação sobre recuperação de senha:** o limite por IP e os cinco erros de código continuam protegendo a rota; o e-mail só é enviado quando houver serviço SMTP/Resend configurado. A comparação e o armazenamento utilizam HMAC SHA-256 e a senha usa bcrypt.

## 3. Bateria executada neste ambiente

| Verificação | Resultado |
|---|---|
| Testes unitários Node `npm run test` | **12/12 passaram** |
| Auditoria estática `node scripts/audit-static.mjs` | **Passou** |
| Verificação de sintaxe JS/MJS `node --check` | **32 arquivos sem erros** |
| Análise de parser JSX (TypeScript 5.8.3 disponível no ambiente) | **30 arquivos sem erros sintáticos** |
| Resolução de caminhos de imports locais | **158 referências verificadas, sem ausentes** |
| Esquema do banco | **11 instruções `CREATE TABLE IF NOT EXISTS`, sem repetição** |
| CSS via parser `tinycss2` | **Sem erros estruturais de stylesheet** |
| `render.yaml` via parser YAML | **Arquivo válido, serviço reconhecido** |
| Busca por arquivos secretos no pacote | **Nenhum `.env` ou `CONTAS_LOCAIS.txt` incluído** |
| Build completo Vite/React | **Não realizado: dependências não instaladas aqui** |
| E2E HTTP + Express + MySQL | **Não realizado: banco/infraestrutura não disponíveis aqui** |
| Envio SMTP/Resend real | **Não realizado: depende das suas credenciais e serviço** |
| Deploy no Render | **Não realizado: depende da conta de hospedagem** |

O acesso a `registry.npmjs.org` falhou com `EAI_AGAIN` neste ambiente. A ausência do build e do teste integrado é uma **limitação de validação**, não uma confirmação de que a aplicação compilou ou de que todos os endpoints funcionam.

## 4. Como executar a verificação completa no seu Windows

Na raiz do projeto revisado, com Node.js 22 ou superior (atendendo ao campo `engines`) e Docker Desktop iniciado:

```bash
npm install
npm run install:all
docker compose up -d --wait
npm run db:init
npm run db:check
npm run audit
npm run build
npm run dev
```

Com a API ativa, em **outro terminal**, antes de publicar e usando **somente o MySQL local de teste**:

```bash
npm run test:e2e
```

O teste de ponta a ponta **cria contas e dados no banco**. Ele verifica entre outros itens: API e MySQL, cadastro de instrutor/aluno e admin (quando `ADMIN_SIGNUP_CODE` está configurado), login incorreto, acesso anônimo, autorização de aluno, vínculo, CRUD de ficha, carga, conclusão, arquivamento, histórico, perfil, alteração de senha e invalidação da sessão anterior. Não rode esse comando contra o banco de produção.

Para gerar um resultado objetivo:

```bash
npm run audit > auditoria.txt 2>&1
npm run build > build.txt 2>&1
```

**Antes de atualizar o banco do MVP existente:** exporte um backup completo e confirme o nome do volume Docker. O script `db:init` cria/atualiza tabelas sem apagar os registros normais, mas toda migração deve ser precedida de backup.

## 5. Testes manuais indispensáveis antes de publicar

- [ ] Tela `/login` mostra apenas e-mail, senha, exibir senha, recuperação e cadastro; não há seletor de perfil.
- [ ] Três contas diferentes (aluno, instrutor, admin) entram pelo mesmo formulário e vão ao painel correto.
- [ ] Login incorreto é rejeitado; sucesso não consome a cota de tentativas inválidas.
- [ ] Cadastro de administrador sem código de convite válido é rejeitado.
- [ ] O aluno consegue vincular e desvincular um instrutor pelo código e visualizar a ficha.
- [ ] O instrutor escolhe um aluno na tabela e o botão de treinos abre **aquele** aluno.
- [ ] O instrutor cria, edita e arquiva uma ficha; a ficha arquivada não aparece nos treinos ativos, mas o histórico permanece.
- [ ] O aluno registra uma carga e conclusão, atualiza a página e continua vendo o registro.
- [ ] O aluno registra medidas e visualiza IMC e evolução semanal.
- [ ] Atualizar a própria conta funciona; mudar senha invalida tokens anteriores.
- [ ] Administração consegue gerenciar usuários sem permitir desativação do último administrador ativo.
- [ ] Recuperação de senha: código chega por e-mail de teste, funciona dentro de 10 min, e expiração/erros são bloqueados.
- [ ] Parar o contêiner MySQL gera mensagem de banco indisponível; religá-lo restaura o acesso.
- [ ] Testar o site em largura de celular e desktop, com teclado e atualização de URLs internas.
- [ ] Fazer o mesmo teste no domínio HTTPS após o deploy, com banco MySQL na nuvem e SMTP/Resend real.

## 6. Limitações conhecidas — não esconder na apresentação

1. **Build e testes integrados ainda pendentes.** O código-fonte foi analisado, mas não executado com todos os serviços neste ambiente.
2. **Rate limiter em memória.** A contagem é por IP, reinicia após restart e não é compartilhada entre múltiplas instâncias. Para escalabilidade, usar Redis ou store compartilhado.
3. **Contas sem verificação de e-mail no cadastro.** Para uso comercial com dados pessoais, acrescentar verificação do endereço de e-mail e política de recuperação segura.
4. **Exclusão de aluno é definitiva.** A API de exclusão de aluno usa `DELETE FROM usuario` com cascata de fichas e históricos; o front-end exige confirmação explícita. O arquivamento de **ficha** é diferente e preserva histórico.
5. **Associação de instrutor por código.** O código permite troca de instrutor. Políticas de revisão, aprovação e histórico de transferências podem ser necessárias numa rede real.
6. **Sem testes de concorrência SQL reais neste ambiente.** O bloqueio de administradores foi implementado, mas deve ser exercitado com MySQL em teste de integração.
7. **Infraestrutura gratuita não equivale a disponibilidade comercial.** O Render Free pode hibernar; a hospedagem deve ter TLS, backups e logs.
8. **Sem isolamento multiacademia.** O sistema atende aos perfis previstos no escopo acadêmico, mas não separa dados por unidades ou organizações diferentes.
9. **Sem testes automáticos de acessibilidade ponta a ponta.** A sintaxe JSX foi analisada, mas é recomendável executar Lighthouse/axe em navegador real.
10. **Dependências não auditadas via npm audit neste ambiente.** Antes de publicar, rodar `npm audit --prefix server` e `npm audit --prefix client` e revisar os alertas, sem aplicar upgrades cegamente.

## 7. Decisão de publicação

**Recomendação: publicação condicionada à validação local**, especialmente a `npm run build`, `npm run db:check` e `npm run test:e2e`, e ao fluxo de recuperação de senha. Após esses testes, o mesmo repositório pode ser enviado ao GitHub e implantado usando `render.yaml`, com banco externo e variáveis privadas no provedor.
