import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { HttpError, asyncHandler, id, validate } from '../utils/http.js';
import { ownedItem, studentForUser } from '../utils/access.js';
import { todayInAcademyTimezone } from '../utils/dates.js';
const router = Router();
router.use(authenticate, requireRole('aluno'));
router.post('/', asyncHandler(async (req, res) => {
  const { item_ficha_id, carga_kg } = validate(z.object({ item_ficha_id: z.coerce.number().int().positive(), carga_kg: z.coerce.number().min(0).max(9999) }), req.body);
  const it = await ownedItem(req, item_ficha_id);
  const [r] = await pool.execute('INSERT INTO historico_carga(aluno_id,item_ficha_id,carga_kg) VALUES(?,?,?)', [it.aluno_id, it.id, carga_kg]);
  res.status(201).json({ id: r.insertId, message: 'Carga registrada.' });
}));
router.put('/conclusao', asyncHandler(async (req, res) => {
  const { item_ficha_id, concluido } = validate(z.object({ item_ficha_id: z.coerce.number().int().positive(), concluido: z.boolean() }), req.body);
  const it = await ownedItem(req, item_ficha_id);
  await pool.execute('INSERT INTO conclusao_exercicio(aluno_id,item_ficha_id,dia,concluido) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE concluido=VALUES(concluido)', [it.aluno_id, it.id, todayInAcademyTimezone(), concluido]);
  res.json({ message: 'Progresso atualizado.' });
}));
router.get('/evolucao', asyncHandler(async (req, res) => {
  const aid = await studentForUser(req.user);
  const exId = req.query.exercicio_id ? id(req.query.exercicio_id) : null;
  const sql = `SELECT e.id AS exercicio_id,e.nome AS exercicio_nome,DATE_FORMAT(DATE_SUB(DATE(h.registrada_em),INTERVAL WEEKDAY(h.registrada_em) DAY),'%Y-%m-%d') AS semana,MAX(h.carga_kg) AS carga_kg FROM historico_carga h JOIN item_ficha it ON h.item_ficha_id=it.id JOIN exercicio e ON e.id=it.exercicio_id WHERE h.aluno_id=? ${exId ? 'AND e.id=?' : ''} GROUP BY e.id,e.nome,semana ORDER BY semana ASC`;
  const [rows] = await pool.execute(sql, exId ? [aid, exId] : [aid]);
  res.json({ data: rows });
}));
router.get('/', asyncHandler(async (req, res) => {
  const aid = await studentForUser(req.user);
  const [rows] = await pool.execute('SELECT h.*,e.nome AS exercicio_nome FROM historico_carga h JOIN item_ficha it ON it.id=h.item_ficha_id JOIN exercicio e ON it.exercicio_id=e.id WHERE h.aluno_id=? ORDER BY h.registrada_em DESC LIMIT 200', [aid]);
  res.json({ data: rows });
}));
export default router;
