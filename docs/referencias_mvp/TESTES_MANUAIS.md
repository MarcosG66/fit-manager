# Checklist de validação antes de apresentar

Executar com MySQL, servidor Express e Vite ativos; para recuperação de senha, abrir o Mailpit em `http://localhost:8025`.

- [ ] `GET /api/health` retorna `{ok:true,db:true}`.
- [ ] Criar conta aluno; senha em claro **não** aparece em `usuario.senha_hash`; login persiste após atualizar página.
- [ ] Criar conta instrutor; receber painel diferente do aluno.
- [ ] Tentar criar `admin` pelo endpoint `/auth/register` e verificar HTTP 400.
- [ ] Entrar com senha errada e verificar HTTP 401.
- [ ] Solicitar recuperação, ler e-mail recebido no Mailpit e redefinir senha com 8 dígitos.
- [ ] Tentar código incorreto, expirado ou usado; verificar rejeição. Novo login só funciona com nova senha.
- [ ] Depois da troca de senha, a sessão autenticada anterior deve dar HTTP 401 em `/auth/me`.
- [ ] Instrutor cadastra aluno, ativa/inativa, edita, filtra e busca; impede login do aluno inativo.
- [ ] Instrutor cadastra grupo e exercício; cria ficha com pelo menos um item para seu aluno.
- [ ] O aluno enxerga somente fichas suas; não consegue criar ficha via API.
- [ ] Aluno salva carga e conclui exercício: barra de progresso muda; recarga da página mantém conclusão.
- [ ] Aluno adiciona avaliação física e verifica IMC calculado (peso/altura²).
- [ ] Após registrar cargas em semanas diferentes, visualizar gráfico semanal.
- [ ] Admin vê totais e busca usuários, gerencia catálogo, mas não vê/edita fichas dos alunos.
- [ ] Testar responsividade pelo DevTools do navegador em viewport mobile (~375 px) e desktop (~1280 px).
- [ ] Confirmar que `.env` e `node_modules` não fazem parte do ZIP e que credenciais padrão não são usadas em produção.
