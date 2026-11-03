import 'dotenv/config';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

/** Teste completo da API com um MySQL de DESENVOLVIMENTO.
 * A execução cria registros temporários; não utilize em banco de produção.
 * Inicie `npm run dev` em outro terminal e execute `npm run test:e2e`.
 */
if (process.env.NODE_ENV === 'production') {
  throw new Error('O teste E2E não é permitido com NODE_ENV=production.');
}
const origin = process.env.TEST_API_ORIGIN || 'http://localhost:3001';
const unique = crypto.randomBytes(6).toString('hex');
const password = `Test!${unique}a1`;
const cookies = new Map();

async function request(path, { method = 'GET', body, account, expect = 200 } = {}) {
  const result = await fetch(`${origin}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(account ? { Cookie: cookies.get(account) || '' } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (account && result.headers.get('set-cookie')) {
    cookies.set(account, result.headers.get('set-cookie').split(';')[0]);
  }
  const data = await result.json();
  assert.equal(result.status, expect, `${method} ${path}: ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  console.log('Verificando a API e o MySQL...');
  const health = await request('/health');
  assert.equal(health.db, true);

  const instructorEmail = `instrutor-${unique}@example.test`;
  await request('/auth/register', {
    method: 'POST', account: 'instrutor', expect: 201,
    body: { nome: 'Instrutor de Teste', email: instructorEmail, senha: password, perfil: 'instrutor' },
  });
  // Login inválido e política de acesso público são testados antes do CRUD.
  await request('/auth/login', { method: 'POST', expect: 401,
    body: { email: instructorEmail, senha: 'senha-incorreta' } });
  await request('/usuarios/totais', { expect: 401 });

  const link = await request('/vinculos/me', { account: 'instrutor' });
  assert.match(link.data.codigo, /^[A-F0-9]{12}$/);

  const studentEmail = `aluno-${unique}@example.test`;
  await request('/auth/register', {
    method: 'POST', account: 'aluno', expect: 201,
    body: { nome: 'Aluno de Teste', email: studentEmail, senha: password, perfil: 'aluno',
      codigoInstrutor: link.data.codigo, objetivo: 'Hipertrofia', plano: 'Mensal' },
  });
  const students = await request('/alunos', { account: 'instrutor' });
  const student = students.data.find(record => record.email === studentEmail);
  assert.ok(student, 'O aluno recém-cadastrado deveria estar vinculado ao instrutor.');

  // O aluno não pode administrar o catálogo nem criar fichas.
  await request('/grupos', { method: 'POST', account: 'aluno', expect: 403,
    body: { nome: `GrupoNegado${unique}` } });
  await request('/fichas', { method: 'POST', account: 'aluno', expect: 403,
    body: { aluno_id: student.id, nome: 'Treino Inadequado', dia_semana: 1, itens: [] } });

  const group = await request('/grupos', {
    method: 'POST', account: 'instrutor', expect: 201, body: { nome: `Grupo ${unique}` },
  });
  const exercise = await request('/exercicios', {
    method: 'POST', account: 'instrutor', expect: 201,
    body: { nome: `Exercício ${unique}`, descricao: 'Exercício criado pelo teste.', grupo_id: group.id },
  });
  const workout = await request('/fichas', {
    method: 'POST', account: 'instrutor', expect: 201,
    body: { aluno_id: student.id, nome: 'Treino do Teste', dia_semana: 1,
      itens: [{ exercicio_id: exercise.id, series: 3, repeticoes: '12', descanso_seg: 60, ordem: 0 }] },
  });
  const list = await request('/fichas', { account: 'aluno' });
  const workoutRecord = list.data.find(record => record.id === workout.id);
  assert.ok(workoutRecord?.itens?.length === 1);
  const itemId = workoutRecord.itens[0].id;

  await request('/cargas', {
    method: 'POST', account: 'aluno', expect: 201,
    body: { item_ficha_id: itemId, carga_kg: 32.5 },
  });
  await request('/cargas/conclusao', {
    method: 'PUT', account: 'aluno', body: { item_ficha_id: itemId, concluido: true },
  });
  await request('/fichas/' + workout.id, { method: 'DELETE', account: 'instrutor' });
  const archivedList = await request('/fichas', { account: 'aluno' });
  assert.ok(!archivedList.data.some(record => record.id === workout.id),
    'Uma ficha arquivada não pode aparecer na lista de treinos ativos.');
  const history = await request('/cargas', { account: 'aluno' });
  assert.ok(history.data.some(record => record.item_ficha_id === itemId), 'O histórico não pode sumir ao arquivar fichas.');

  await request('/usuarios', { account: 'aluno', expect: 403 });
  const me = await request('/auth/me', { account: 'aluno' });
  assert.equal(me.user.perfil, 'aluno');

  // Alterar o perfil e a senha não pode mudar o papel do usuário. O JWT antigo
  // é invalidado pela mudança de token_version, mesmo antes do prazo de expiração.
  await request('/auth/profile', { method: 'PUT', account: 'aluno',
    body: { nome: 'Aluno Revisado', email: studentEmail, objetivo: 'Evolução', plano: 'Mensal' } });
  const updatedProfile = await request('/auth/profile', { account: 'aluno' });
  assert.equal(updatedProfile.data.nome, 'Aluno Revisado');
  assert.equal(updatedProfile.data.perfil, 'aluno');
  const novaSenha = `${password}Novo`;
  await request('/auth/password', { method: 'PUT', account: 'aluno',
    body: { senhaAtual: password, novaSenha } });
  await request('/auth/me', { account: 'aluno', expect: 401 });
  await request('/auth/login', { method: 'POST', expect: 401,
    body: { email: studentEmail, senha: password } });
  const novoLogin = await request('/auth/login', { method: 'POST', account: 'aluno',
    body: { email: studentEmail, senha: novaSenha } });
  assert.equal(novoLogin.user.perfil, 'aluno');

  await request('/auth/register', { method: 'POST', expect: 403,
    body: { nome: 'Admin Sem Convite', email: `admin-negado-${unique}@example.test`,
      senha: password, perfil: 'admin', codigoAdmin: 'convite-incorreto' } });

  if (process.env.ADMIN_SIGNUP_CODE?.length >= 24) {
    await request('/auth/register', {
      method: 'POST', account: 'admin', expect: 201,
      body: { nome: 'Admin de Teste', email: `admin-${unique}@example.test`, senha: password,
        perfil: 'admin', codigoAdmin: process.env.ADMIN_SIGNUP_CODE },
    });
    const totals = await request('/usuarios/totais', { account: 'admin' });
    assert.ok(totals.data.admin >= 1);
  }
  console.log('✅ TESTE E2E PASSOU: banco, cadastro, login inválido, vínculo, ficha, cargas, arquivamento, histórico e permissões.');
  console.log('Contas de teste criadas: ', instructorEmail, studentEmail);
}
main().catch(error => { console.error('❌ Teste E2E falhou:', error.message); process.exitCode = 1; });
