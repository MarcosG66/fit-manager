import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { z } from 'zod';
import { pool, transaction } from '../config/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler, HttpError, id, validate } from '../utils/http.js';
import { instructorForUser, canAccessStudent } from '../utils/access.js';
const router = Router();
router.use(authenticate, requireRole('instrutor'));
const fields = z.object({ nome: z.string().trim().min(2).max(130), email: z.string().trim().email().max(190).transform(x => x.toLowerCase()), objetivo: z.string().max(200).default(''), plano: z.string().max(100).default(''), status: z.enum(['ativo', 'inativo']).optional() });
const query = `SELECT a.id,a.usuario_id,a.instrutor_id,a.objetivo,a.plano,a.status,a.data_ingresso,u.nome,u.email,(SELECT COUNT(*) FROM ficha_treino f WHERE f.aluno_id=a.id AND f.arquivada_em IS NULL) AS total_fichas FROM aluno a JOIN usuario u ON u.id=a.usuario_id WHERE a.instrutor_id=?`;
router.get('/', asyncHandler(async (req, res) => {
  const instructorId = await instructorForUser(req.user);
  const { busca = '', status = '' } = req.query;
  if (!['', 'ativo', 'inativo'].includes(status))
    throw new HttpError(400, 'Filtro de status inválido.');
  const [rows] = await pool.execute(`${query} ${status ? ' AND a.status=?' : ''} ${busca ? ' AND (u.nome LIKE ? OR u.email LIKE ?)' : ''} ORDER BY u.nome`, [
    instructorId, ...(status ? [status] : []), ...(busca ? [`%${String(busca).slice(0, 90)}%`, `%${String(busca).slice(0, 90)}%`] : [])
  ]);
  res.json({ data: rows });
}));
router.get('/:id', asyncHandler(async (req, res) => {
  const aid = id(req.params.id);
  await canAccessStudent(req.user, aid);
  const [[row]] = await pool.execute(`${query} AND a.id=?`, [await instructorForUser(req.user), aid]);
  res.json({ data: row });
}));
router.post('/', asyncHandler(async (req, res) => {
  const body = validate(fields.extend({ senha: z.string().min(8).max(72).optional() }), req.body);
  const instructorId = await instructorForUser(req.user);
  // Sem senha, o aluno deve usar "Esqueci minha senha" para ativar o acesso (e-mail SMTP).
  const password = body.senha || crypto.randomBytes(32).toString('base64url');
  const hash = await bcrypt.hash(password, 12);
  const aid = await transaction(async (conn) => {
    const [u] = await conn.execute('INSERT INTO usuario(nome,email,senha_hash,perfil) VALUES(?,?,?,\'aluno\')', [body.nome, body.email, hash]);
    const [a] = await conn.execute('INSERT INTO aluno(usuario_id,instrutor_id,objetivo,plano,data_ingresso,status) VALUES(?,?,?,?,CURRENT_DATE(),?)', [u.insertId, instructorId, body.objetivo, body.plano, body.status || 'ativo']);
    return a.insertId;
  });
  res.status(201).json({ id: aid, message: body.senha ? 'Aluno cadastrado.' : 'Aluno cadastrado. Peça que ele use Esqueci minha senha para criar seu acesso.' });
}));
router.put('/:id', asyncHandler(async (req, res) => {
  const aid = id(req.params.id);
  await canAccessStudent(req.user, aid);
  const body = validate(fields.partial().refine(x => Object.keys(x).length > 0), req.body);
  await transaction(async (conn) => {
    const [[aluno]] = await conn.execute('SELECT usuario_id FROM aluno WHERE id=? FOR UPDATE', [aid]);
    if (!aluno)
      throw new HttpError(404, 'Aluno não encontrado.');
    if (body.nome !== undefined || body.email !== undefined) {
      const items = [];
      const values = [];
      if (body.nome !== undefined) {
        items.push('nome=?');
        values.push(body.nome);
      }
      if (body.email !== undefined) {
        items.push('email=?');
        values.push(body.email);
      }
      await conn.execute(`UPDATE usuario SET ${items.join(',')} WHERE id=?`, [...values, aluno.usuario_id]);
    }
    const items = [];
    const values = [];
    for (const [k, col] of [['objetivo', 'objetivo'], ['plano', 'plano'], ['status', 'status']]) {
      if (body[k] !== undefined) {
        items.push(`${col}=?`);
        values.push(body[k]);
      }
    }
    if (items.length)
      await conn.execute(`UPDATE aluno SET ${items.join(',')} WHERE id=?`, [...values, aid]);
  });
  res.json({ message: 'Aluno atualizado.' });
}));
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const aid = id(req.params.id);
  await canAccessStudent(req.user, aid);
  const { status } = validate(z.object({ status: z.enum(['ativo', 'inativo']) }), req.body);
  await pool.execute('UPDATE aluno SET status=? WHERE id=?', [status, aid]);
  res.json({ message: 'Status atualizado.' });
}));
router.delete('/:id', asyncHandler(async (req, res) => {
  const aid = id(req.params.id);
  await canAccessStudent(req.user, aid);
  // Exclusão da conta é definitiva, incluindo fichas e registros.
  const [[row]] = await pool.execute('SELECT usuario_id FROM aluno WHERE id=?', [aid]);
  await pool.execute('DELETE FROM usuario WHERE id=?', [row.usuario_id]);
  res.json({ message: 'Aluno excluído.' });
}));
export default router;
