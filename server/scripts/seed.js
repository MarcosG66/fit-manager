import 'dotenv/config';
import { createLinkCode } from '../src/utils/links.js';
import bcrypt from 'bcryptjs';
import { pool, transaction } from '../src/config/db.js';
const pw = { aluno: process.env.SEED_STUDENT_PASSWORD, instrutor: process.env.SEED_INSTRUCTOR_PASSWORD, admin: process.env.SEED_ADMIN_PASSWORD };
if (Object.values(pw).some(v => !v || v.length < 8))
  throw new Error('Configure SEED_STUDENT_PASSWORD, SEED_INSTRUCTOR_PASSWORD e SEED_ADMIN_PASSWORD (8+ caracteres).');
const instructors = [['Carlos Mendes', 'carlos@academia.com', 'instrutor'], ['Ana Lima', 'ana@email.com', 'aluno'], ['Valter Expedito', 'admin@academia.com', 'admin']];
await transaction(async (conn) => {
  const groups = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Panturrilha', 'Abdômen'];
  for (const nome of groups)
    await conn.execute('INSERT INTO grupo_muscular(nome) VALUES(?) ON DUPLICATE KEY UPDATE nome=VALUES(nome)', [nome]);
  const exercises = [['Supino Reto', 'Peito', 'Deite no banco, abaixe a barra até o peito e empurre.'], ['Supino Inclinado', 'Peito', 'Com o banco inclinado, empurre os halteres para cima.'], ['Crossover', 'Peito', 'Cruze as mãos à frente do corpo, mantendo os cotovelos semiflexionados.'], ['Remada Curvada', 'Costas', 'Incline o tronco e puxe a barra em direção ao abdômen.'], ['Puxada na Polia', 'Costas', 'Puxe a barra até a parte superior do peito.'], ['Agachamento Livre', 'Pernas', 'Flexione quadril e joelhos mantendo a coluna neutra.'], ['Leg Press 45°', 'Pernas', 'Empurre a plataforma sem travar completamente os joelhos.'], ['Cadeira Extensora', 'Pernas', 'Estenda os joelhos com movimento controlado.'], ['Elevação Lateral', 'Ombros', 'Eleve os halteres até a altura dos ombros.'], ['Rosca Direta', 'Bíceps', 'Flexione os cotovelos mantendo-os junto ao tronco.'], ['Tríceps Polia', 'Tríceps', 'Estenda os braços sem deslocar os cotovelos.'], ['Panturrilha em Pé', 'Panturrilha', 'Suba e desça os calcanhares lentamente.'], ['Prancha', 'Abdômen', 'Mantenha o tronco alinhado e contraído.']];
  for (const [nome, g, descricao] of exercises) {
    const [[exist]] = await conn.execute('SELECT id FROM exercicio WHERE nome=?', [nome]);
    if (!exist)
      await conn.execute('INSERT INTO exercicio(nome,grupo_id,descricao) VALUES(?,(SELECT id FROM grupo_muscular WHERE nome=?),?)', [nome, g, descricao]);
  }
  for (const [nome, email, perfil] of instructors) {
    const [[exists]] = await conn.execute('SELECT id FROM usuario WHERE email=?', [email]);
    if (exists)
      continue;
    const hash = await bcrypt.hash(pw[perfil], 12);
    const [insert] = await conn.execute('INSERT INTO usuario(nome,email,senha_hash,perfil) VALUES(?,?,?,?)', [nome, email, hash, perfil]);
    if (perfil === 'instrutor')
      await conn.execute('INSERT INTO instrutor(usuario_id,codigo_vinculo) VALUES(?,?)', [insert.insertId, createLinkCode()]);
    if (perfil === 'aluno')
      await conn.execute("INSERT INTO aluno(usuario_id,objetivo,plano,data_ingresso,status) VALUES(?,'Hipertrofia','Mensal',CURRENT_DATE(),'ativo')", [insert.insertId]);
  }
  const [[inst]] = await conn.execute('SELECT id FROM instrutor WHERE usuario_id=(SELECT id FROM usuario WHERE email=?)', ['carlos@academia.com']);
  const [[aluno]] = await conn.execute('SELECT id FROM aluno WHERE usuario_id=(SELECT id FROM usuario WHERE email=?)', ['ana@email.com']);
  await conn.execute('UPDATE aluno SET instrutor_id=? WHERE id=?', [inst.id, aluno.id]);
  const [[hasFicha]] = await conn.execute('SELECT id FROM ficha_treino WHERE aluno_id=? LIMIT 1', [aluno.id]);
  if (!hasFicha) {
    const [f] = await conn.execute("INSERT INTO ficha_treino(aluno_id,nome,dia_semana) VALUES(?,'Treino A - Peito',1)", [aluno.id]);
    for (const [idx, nome] of ['Supino Reto', 'Supino Inclinado', 'Crossover'].entries())
      await conn.execute('INSERT INTO item_ficha(ficha_id,exercicio_id,series,repeticoes,descanso_seg,ordem) VALUES(?,(SELECT id FROM exercicio WHERE nome=?),3,\'12\',60,?)', [f.insertId, nome, idx]);
  }
});
await pool.end();
console.log('Dados de demonstração criados (senhas lidas apenas do .env).');
