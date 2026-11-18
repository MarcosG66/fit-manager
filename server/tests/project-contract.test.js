import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = relative => readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('a tela de login não apresenta seletores de perfil fictícios', () => {
  const loginPage = read('client/src/pages/LoginPage.jsx');
  assert.doesNotMatch(loginPage, /role-select|role-chip|Perfil de acesso|setRole/);
  assert.match(loginPage, /login\(\{ email, senha \}\)/);
  assert.match(loginPage, /DASHBOARD_POR_PERFIL\[usuario\.perfil\]/);
});

test('as restrições de login são independentes e sucesso não consome cota', () => {
  const auth = read('server/src/routes/auth.js');
  for (const limiter of [
    'loginRateLimiter', 'registerRateLimiter', 'recoveryRateLimiter',
    'resetPasswordRateLimiter', 'changePasswordRateLimiter',
  ]) assert.match(auth, new RegExp(`const ${limiter} = rateLimit`));
  for (const route of ['register', 'login', 'forgot-password', 'reset-password']) {
    assert.ok(auth.includes(`router.post('/${route}',`));
  }
  assert.equal((auth.match(/skipSuccessfulRequests: true/g) ?? []).length, 2);
});

test('o e-mail não é enviado antes de persistir o código de redefinição', () => {
  const auth = read('server/src/routes/auth.js');
  assert.ok(auth.indexOf("'INSERT INTO redefinicao_senha(usuario_id,codigo_hash,expira_em)") < auth.indexOf('await sendResetCode('));
  assert.match(auth, /DELETE FROM redefinicao_senha WHERE id=\?/);
});

test('a exclusão de fichas é arquivamento e a interface informa preservação do histórico', () => {
  const fichas = read('server/src/routes/fichas.js');
  const ui = read('client/src/components/instrutor/GestaoTreinos.jsx');
  assert.match(fichas, /UPDATE ficha_treino SET arquivada_em=NOW\(\)/);
  assert.match(ui, /histórico de cargas será preservado/);
  assert.doesNotMatch(ui, /Excluir a ficha/);
});

test('o serviço em nuvem usa API e interface no mesmo processo', () => {
  const backend = read('server/src/index.js');
  assert.match(backend, /express\.static\(pastaBuild/);
  assert.match(backend, /app\.use\('\/api\/auth', authRoutes\)/);
  assert.match(backend, /\/api\/health/);
  const yaml = read('render.yaml');
  assert.match(yaml, /buildCommand:/);
  assert.match(yaml, /startCommand:/);
});


test('o tutorial existe como rota pública e pode ser acessado a partir de todos os perfis', () => {
  const app = read('client/src/App.jsx');
  const tutorial = read('client/src/pages/TutorialPage.jsx');
  const authLayout = read('client/src/components/AuthLayout.jsx');
  const student = read('client/src/pages/StudentDashboard.jsx');
  const sidebar = read('client/src/components/BarraLateral.jsx');
  const layout = read('client/src/components/PainelLayout.jsx');

  assert.match(app, /path="\/tutorial" element=\{<TutorialPage \/>\}/);
  assert.match(tutorial, /aluno: \{/);
  assert.match(tutorial, /instrutor: \{/);
  assert.match(tutorial, /admin: \{/);
  assert.match(tutorial, /aria-pressed/);
  for (const component of [authLayout, student, sidebar, layout]) {
    assert.match(component, /to="\/tutorial"/);
  }
});


test('instrutor e administrador compartilham um único catálogo de exercícios', () => {
  const instrutor = read('client/src/pages/InstructorDashboard.jsx');
  const admin = read('client/src/pages/AdminDashboard.jsx');
  const catalogo = read('client/src/components/CatalogoExercicios.jsx');
  const tutorial = read('client/src/pages/TutorialPage.jsx');

  assert.doesNotMatch(instrutor, /Banco de Exercícios|id: 'exercicios'/);
  assert.equal((instrutor.match(/id: 'catalogo'/g) ?? []).length, 1);
  assert.match(instrutor, /id: 'catalogo', label: 'Catálogo de Exercícios', icon: 'bi-journal-text'/);
  assert.match(admin, /id: 'catalogo', label: 'Catálogo de Exercícios', icon: 'bi-journal-text'/);
  assert.doesNotMatch(tutorial, /Banco de Exercícios/);
  assert.match(catalogo, /Gerenciar grupos/);
  assert.match(catalogo, /Novo exercício/);
});

test('catálogo unificado mantém operações de exercícios e grupos na API original', () => {
  const interfaceCatalogo = read('client/src/components/CatalogoExercicios.jsx');
  const rotas = read('server/src/routes/catalogo.js');
  const ficha = read('client/src/components/FormFicha.jsx');

  assert.match(interfaceCatalogo, /api\('\/grupos', \{ method: 'POST'/);
  assert.match(interfaceCatalogo, /api\(`\/grupos\/\$\{grupoEmEdicao\}`/);
  assert.match(interfaceCatalogo, /api\(`\/grupos\/\$\{grupo\.id\}`/);
  assert.match(interfaceCatalogo, /api\(exercicio \? `\/exercicios\/\$\{exercicio\.id\}` : '\/exercicios'/);
  assert.match(interfaceCatalogo, /api\(`\/exercicios\/\$\{exercicio\.id\}`/);
  for (const rota of ["'/grupos'", "'/grupos/:id'", "'/exercicios'", "'/exercicios/:id'"]) {
    assert.ok(rotas.includes(rota), `Rota existente preservada: ${rota}`);
  }
  assert.match(ficha, /useResource\('\/exercicios'\)/);
});
