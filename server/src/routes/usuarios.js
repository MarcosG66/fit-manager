import { Router } from 'express';
import { z } from 'zod';
import { pool, transaction } from '../config/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { HttpError, asyncHandler, id, validate } from '../utils/http.js';

const router = Router();
router.use(authenticate, requireRole('admin'));

router.get('/', asyncHandler(async (req, res) => {
  const busca = String(req.query.busca || '').slice(0, 90);
  const [rows] = await pool.execute(
    `SELECT u.id,u.nome,u.email,u.perfil,u.ativo,u.criado_em,a.status
     FROM usuario u LEFT JOIN aluno a ON a.usuario_id=u.id
     WHERE u.nome LIKE ? OR u.email LIKE ? ORDER BY u.nome`,
    [`%${busca}%`, `%${busca}%`],
  );
  res.json({ data: rows });
}));

router.get('/totais', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT perfil,COUNT(*) AS total FROM usuario GROUP BY perfil');
  const totais = { aluno: 0, instrutor: 0, admin: 0 };
  rows.forEach(record => { totais[record.perfil] = record.total; });
  res.json({ data: totais });
}));

router.patch('/:id/ativo', asyncHandler(async (req, res) => {
  const targetId = id(req.params.id);
  const { ativo } = validate(z.object({ ativo: z.boolean() }).strict(), req.body);
  if (targetId === req.user.id && !ativo) {
    throw new HttpError(400, 'Não é permitido desativar sua própria conta.');
  }
  await transaction(async connection => {
    // Bloqueia as linhas administrativas em ordem estável ANTES de consultar o
    // usuário-alvo. Evita que dois administradores desativem um ao outro ao
    // mesmo tempo, deixando o sistema sem nenhum administrador ativo.
    let administradoresAtivos;
    if (!ativo) {
      const [administradores] = await connection.query(
        "SELECT id,ativo FROM usuario WHERE perfil='admin' ORDER BY id FOR UPDATE",
      );
      administradoresAtivos = administradores.filter(item => Boolean(item.ativo)).length;
    }

    const [[target]] = await connection.execute(
      'SELECT perfil,ativo FROM usuario WHERE id=? FOR UPDATE', [targetId],
    );
    if (!target) throw new HttpError(404, 'Usuário não encontrado.');
    if (target.perfil === 'admin' && !ativo && target.ativo && administradoresAtivos <= 1) {
      throw new HttpError(409, 'É necessário manter pelo menos um administrador ativo.');
    }
    await connection.execute(
      'UPDATE usuario SET ativo=?,token_version=token_version+1 WHERE id=?',
      [ativo, targetId],
    );
  });
  res.json({ message: ativo ? 'Conta ativada.' : 'Conta desativada.' });
}));

export default router;
