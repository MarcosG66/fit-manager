import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler, HttpError, validate } from '../utils/http.js';
import { studentForUser, instructorForUser } from '../utils/access.js';
import { createLinkCode } from '../utils/links.js';

const router = Router();
router.use(authenticate);

// Um código compartilhável substitui o vínculo manual feito diretamente no banco.
router.get('/me', asyncHandler(async (req, res) => {
  if (req.user.perfil === 'instrutor') {
    const instructorId = await instructorForUser(req.user);
    const [[record]] = await pool.execute(
      'SELECT codigo_vinculo FROM instrutor WHERE id=?', [instructorId],
    );
    return res.json({ data: { perfil: 'instrutor', codigo: record.codigo_vinculo } });
  }
  if (req.user.perfil === 'aluno') {
    const [[record]] = await pool.execute(
      `SELECT a.instrutor_id,u.nome AS instrutor_nome,u.email AS instrutor_email
       FROM aluno a LEFT JOIN instrutor i ON i.id=a.instrutor_id
       LEFT JOIN usuario u ON u.id=i.usuario_id WHERE a.usuario_id=?`,
      [req.user.id],
    );
    return res.json({ data: { perfil: 'aluno', ...record } });
  }
  throw new HttpError(403, 'Disponível apenas para aluno e instrutor.');
}));

router.post('/associar', requireRole('aluno'), asyncHandler(async (req, res) => {
  const { codigo } = validate(z.object({ codigo: z.string().trim().regex(/^[0-9a-fA-F]{12}$/) }).strict(), req.body);
  const [[instructor]] = await pool.execute(
    `SELECT i.id FROM instrutor i JOIN usuario u ON u.id=i.usuario_id
     WHERE i.codigo_vinculo=? AND u.ativo=1`, [codigo.toUpperCase()],
  );
  if (!instructor) throw new HttpError(404, 'Código do instrutor não encontrado.');
  const studentId = await studentForUser(req.user);
  await pool.execute('UPDATE aluno SET instrutor_id=? WHERE id=?', [instructor.id, studentId]);
  res.json({ message: 'Vínculo com o instrutor atualizado.' });
}));

router.delete('/me', requireRole('aluno'), asyncHandler(async (req, res) => {
  const studentId = await studentForUser(req.user);
  await pool.execute('UPDATE aluno SET instrutor_id=NULL WHERE id=?', [studentId]);
  res.json({ message: 'Vínculo removido. Suas fichas permanecem disponíveis.' });
}));

router.post('/codigo', requireRole('instrutor'), asyncHandler(async (req, res) => {
  const instructorId = await instructorForUser(req.user);
  const newCode = createLinkCode();
  await pool.execute('UPDATE instrutor SET codigo_vinculo=? WHERE id=?', [newCode, instructorId]);
  res.json({ data: { codigo: newCode }, message: 'Novo código criado. O anterior foi invalidado.' });
}));

export default router;
