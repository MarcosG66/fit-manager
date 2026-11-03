import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { HttpError, asyncHandler, id, validate } from '../utils/http.js';
const router = Router();
router.use(authenticate);
router.get('/grupos', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM grupo_muscular ORDER BY nome');
  res.json({ data: rows });
}));
router.post('/grupos', requireRole('instrutor', 'admin'), asyncHandler(async (req, res) => {
  const { nome } = validate(z.object({ nome: z.string().trim().min(2).max(100) }), req.body);
  const [r] = await pool.execute('INSERT INTO grupo_muscular(nome) VALUES(?)', [nome]);
  res.status(201).json({ id: r.insertId });
}));
router.put('/grupos/:id', requireRole('instrutor', 'admin'), asyncHandler(async (req, res) => {
  const { nome } = validate(z.object({ nome: z.string().trim().min(2).max(100) }), req.body);
  const [r] = await pool.execute('UPDATE grupo_muscular SET nome=? WHERE id=?', [nome, id(req.params.id)]);
  if (!r.affectedRows)
    throw new HttpError(404, 'Grupo não encontrado.');
  res.json({ message: 'Grupo atualizado.' });
}));
router.delete('/grupos/:id', requireRole('instrutor', 'admin'), asyncHandler(async (req, res) => {
  const [r] = await pool.execute('DELETE FROM grupo_muscular WHERE id=?', [id(req.params.id)]);
  if (!r.affectedRows)
    throw new HttpError(404, 'Grupo não encontrado.');
  res.json({ message: 'Grupo excluído.' });
}));
router.get('/exercicios', asyncHandler(async (req, res) => {
  let sql = 'SELECT e.id,e.nome,e.descricao,e.grupo_id,g.nome AS grupo_nome FROM exercicio e JOIN grupo_muscular g ON g.id=e.grupo_id WHERE 1=1';
  const params = [];
  if (req.query.grupo_id) {
    sql += ' AND e.grupo_id=?';
    params.push(id(req.query.grupo_id));
  }
  if (req.query.busca) {
    sql += ' AND e.nome LIKE ?';
    params.push(`%${String(req.query.busca).slice(0, 90)}%`);
  }
  const [rows] = await pool.execute(sql + ' ORDER BY g.nome,e.nome', params);
  res.json({ data: rows });
}));
const bodySchema = z.object({ nome: z.string().trim().min(2).max(160), descricao: z.string().max(5000).default(''), grupo_id: z.coerce.number().int().positive() });
router.post('/exercicios', requireRole('instrutor', 'admin'), asyncHandler(async (req, res) => {
  const b = validate(bodySchema, req.body);
  const [r] = await pool.execute('INSERT INTO exercicio(nome,descricao,grupo_id) VALUES(?,?,?)', [b.nome, b.descricao, b.grupo_id]);
  res.status(201).json({ id: r.insertId });
}));
router.put('/exercicios/:id', requireRole('instrutor', 'admin'), asyncHandler(async (req, res) => {
  const b = validate(bodySchema, req.body);
  const [r] = await pool.execute('UPDATE exercicio SET nome=?,descricao=?,grupo_id=? WHERE id=?', [b.nome, b.descricao, b.grupo_id, id(req.params.id)]);
  if (!r.affectedRows)
    throw new HttpError(404, 'Exercício não encontrado.');
  res.json({ message: 'Exercício atualizado.' });
}));
router.delete('/exercicios/:id', requireRole('instrutor', 'admin'), asyncHandler(async (req, res) => {
  const [r] = await pool.execute('DELETE FROM exercicio WHERE id=?', [id(req.params.id)]);
  if (!r.affectedRows)
    throw new HttpError(404, 'Exercício não encontrado.');
  res.json({ message: 'Exercício excluído.' });
}));
export default router;
