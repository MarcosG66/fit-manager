# Decisões arquiteturais

- **Apresentação:** Vite + React, React Router, componentes em `components/`, páginas em `pages/`. `services/api.js` contém o único cliente HTTP JSON. Bootstrap 5 e CSS próprio dão responsividade.
- **Aplicação:** Node.js + Express. `routes/` agrupa endpoints por domínio; `middleware/auth.js` autentica/verifica perfil; `utils/access.js` confirma a propriedade dos recursos; `services/mail.js` envia códigos; Zod valida o corpo.
- **Dados:** MySQL8.4, nove entidades do plano mais `conclusao_exercicio` e `redefinicao_senha`. `mysql2/promise` usa prepared statements e transações em operações multi-tabelas.
- **Segurança:** hash bcrypt; JWT em cookie httpOnly SameSite Strict; versionamento de token invalidado na mudança de senha; códigos de recuperação com HMAC; rate limit básico; helmet e CORS configurado. O registro de `admin` não existe na API pública.
- **Front/backend separados:** no desenvolvimento o Vite encaminha `/api` para Express; em publicação, configurar a URL e domínio/proxy antes de compilar.
- **Arquivos do Figma:** o layout visual e o logo vêm do protótipo; telas com mocks foram reimplementadas para não dependerem de senhas armazenadas no navegador.

## Extensões sugeridas, não incluídas

Convites e associação de alunos que fizeram cadastro público, multiacademia, autenticação de e-mail no cadastro, testes automatizados E2E, paginação de grandes bases, auditoria de exclusões, backups e implementação de políticas de privacidade para dados de saúde/medidas. A implantação real requer HTTPS e serviço SMTP, pois o Mailpit é apenas de desenvolvimento.


## Componentização da versão legível

- `components/aluno/TreinosAluno.jsx`: ficha e progresso diário.
- `components/aluno/MetricasAluno.jsx`: avaliações de peso, altura e IMC.
- `components/aluno/EvolucaoAluno.jsx`: gráfico de evolução de cargas.
- `components/instrutor/ListaAlunos.jsx`: cadastro, filtros e status.
- `components/instrutor/GestaoTreinos.jsx`: criação, edição e exclusão de fichas.
- `pages/StudentDashboard.jsx` e `pages/InstructorDashboard.jsx`: apenas estrutura e escolha de seções, sem concentrar todas as telas.

O guia `GUIA_DE_APRESENTACAO_DO_CODIGO.md` mostra por onde começar a leitura.
