# Rastreabilidade do plano — Etapa 3

| Requisito | Entrega | Arquivos principais |
|---|---|---|
| RF01 — cadastro/CRUD e status | Instrutor cadastra, busca, edita, ativa, inativa e exclui alunos | `routes/alunos.js`, `ListaAlunos.jsx`, `FormAluno.jsx` |
| RF02 — login por perfil | Cadastro de aluno, instrutor e admin (com convite), login e redirecionamento | `routes/auth.js`, `auth.js`, `RegisterPage.jsx`, `App.jsx` |
| RF03 — CRUD fichas | Criar/editar/arquivar e organizar itens | `routes/fichas.js`, `GestaoTreinos.jsx`, `FormFicha.jsx` |
| RF04 — catálogo | Grupos e exercícios cadastrados no MySQL | `routes/catalogo.js`, `CatalogoExercicios.jsx` |
| RF05 — carga do aluno | Registro de kg, persistência por item da ficha | `routes/cargas.js`, `CardExercicio.jsx` |
| RF06 — conclusão/progresso | Conclusão diária por exercício, barra de progresso | `routes/cargas.js`, `TreinosAluno.jsx` |
| RF07 — medidas/IMC | Peso, altura, registro e consulta de avaliações | `routes/avaliacoes.js`, `MetricasAluno.jsx` |
| RF08 — evolução | Agregação de carga semanal e gráficos | `routes/cargas.js`, `EvolucaoAluno.jsx` |
| RF09 — admin | Totais por perfil, busca, catálogo, ativação de conta | `routes/usuarios.js`, `AdminDashboard.jsx` |
| RF10 — logout | Remoção de cookie de sessão | `routes/auth.js`, `AuthContext.jsx`, `BarraLateral.jsx` |
| RNF01 — responsividade | Componentes React + Bootstrap e CSS mobile-first | `client/src/styles/global.css`, `BarraNavegacao.jsx` |
| RNF02 — hash | bcrypt 12 rounds; nunca guarda a senha em texto | `routes/auth.js`, `routes/alunos.js` |
| RNF03 — API JSON | REST/HTTP com `fetch`; conexão MySQL só no Express | `services/api.js`, `server/src/index.js` |
| RNF04 — interface intuitiva | Cards de exercício e painel mobile do aluno | `CardExercicio.jsx`, `StudentDashboard.jsx` |
| RNF05 — acesso por perfil | `authenticate`, `requireRole` e autorização de propriedade de dados | `middleware/auth.js`, `utils/access.js` |

## Funcionalidades adicionais à Etapa 1

- Cadastro dos **três** papéis com convite administrativo privado.
- Autoassociação do aluno ao instrutor via código, durante ou depois do cadastro.
- Gerenciamento de perfil e alteração de senha.
- Bloqueio e reativação de contas pelo administrador.
- Recuperação de senha por e-mail com código numérico e expiração.
- Arquivamento de fichas e itens para manter cargas históricas.
- Scripts SQL, migrações e arquivos de deploy.

**Observação:** a presença do código não substitui a execução dos testes completos. Use `docs/TESTES_FINAIS.md` para validar o comportamento.
