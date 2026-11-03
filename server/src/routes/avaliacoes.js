import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler, id, validate, HttpError } from '../utils/http.js';
import { studentForUser } from '../utils/access.js';
const router = Router();
router.use(authenticate, requireRole('aluno'));
router.get('/', asyncHandler(async (req, res) => {
  const aid = await studentForUser(req.user);
  const [rows] = await pool.execute('SELECT id,peso_kg,altura_m,data_avaliacao,ROUND(peso_kg/POW(altura_m,2),1) AS imc FROM avaliacao_fisica WHERE aluno_id=? ORDER BY data_avaliacao DESC,id DESC', [aid]);
  res.json({ data: rows });
}));
router.post('/', asyncHandler(async (req, res) => {
  const b = validate(z.object({ peso_kg: z.coerce.number().min(10).max(500), altura_m: z.coerce.number().min(0.8).max(2.5) }), req.body);
  const aid = await studentForUser(req.user);
  const [r] = await pool.execute('INSERT INTO avaliacao_fisica(aluno_id,peso_kg,altura_m) VALUES(?,?,?)', [aid, b.peso_kg, b.altura_m]);
  res.status(201).json({ id: r.insertId, imc: Math.round(b.peso_kg / b.altura_m ** 2 * 10) / 10 });
}));
router.delete('/:id', asyncHandler(async (req, res) => {
  const aid = await studentForUser(req.user);
  const [r] = await pool.execute('DELETE FROM avaliacao_fisica WHERE id=? AND aluno_id=?', [id(req.params.id), aid]);
  if (!r.affectedRows)
    throw new HttpError(404, 'Avaliação não encontrada.');
  res.json({ message: 'Avaliação excluída.' });
}));
export default router;
