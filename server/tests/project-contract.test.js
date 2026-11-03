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
