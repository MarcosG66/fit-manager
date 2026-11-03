import { Router } from 'express';
import { z } from 'zod';
import { pool, transaction } from '../config/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { HttpError, asyncHandler, id, validate } from '../utils/http.js';
import { canAccessStudent, ownedFicha, ownedItem, studentForUser } from '../utils/access.js';
import { todayInAcademyTimezone } from '../utils/dates.js';
const router = Router();
router.use(authenticate);
const itemSchema = z.object({ id: z.coerce.number().int().positive().optional(), exercicio_id: z.coerce.number().int().positive(), series: z.coerce.number().int().min(1).max(20), repeticoes: z.string().trim().min(1).max(30), descanso_seg: z.coerce.number().int().min(0).max(3600), carga_sugerida_kg: z.coerce.number().min(0).max(9999).nullable().optional(), ordem: z.coerce.number().int().min(0).max(65535).default(0) });
const fichaSchema = z.object({ aluno_id: z.coerce.number().int().positive(), nome: z.string().trim().min(2).max(120), dia_semana: z.coerce.number().int().min(0).max(6), itens: z.array(itemSchema).min(1, 'Inclua pelo menos um exercício.').max(60) });
async function loadFichas(rows) {
  if (!rows.length)
    return [];
  const placeholders = rows.map(() => '?').join(',');
  const [items] = await pool.execute(`SELECT it.*,e.nome AS exercicio_nome,e.descricao AS exercicio_descricao,g.nome AS grupo_nome, (SELECT h.carga_kg FROM historico_carga h WHERE h.item_ficha_id=it.id ORDER BY h.registrada_em DESC,h.id DESC LIMIT 1) AS ultima_carga, (SELECT c.concluido FROM conclusao_exercicio c WHERE c.item_ficha_id=it.id AND c.dia=? LIMIT 1) AS concluido_hoje FROM item_ficha it JOIN exercicio e ON e.id=it.exercicio_id JOIN grupo_muscular g ON g.id=e.grupo_id WHERE it.ficha_id IN (${placeholders}) AND it.removido_em IS NULL ORDER BY it.ordem,it.id`, [todayInAcademyTimezone(), ...rows.map(x => x.id)]);
  return rows.map(f => ({ ...f, itens: items.filter(i => i.ficha_id === f.id) }));
}
router.get('/', asyncHandler(async (req, res) => {
  if (req.user.perfil === 'admin')
    throw new HttpError(403, 'Seu perfil não possui permissão.');
  const aid = req.user.perfil === 'aluno' ? await studentForUser(req.user) : id(req.query.aluno_id);
  await canAccessStudent(req.user, aid);
  const [rows] = await pool.execute('SELECT * FROM ficha_treino WHERE aluno_id=? AND arquivada_em IS NULL ORDER BY dia_semana,criada_em DESC', [aid]);
  res.json({ data: await loadFichas(rows) });
}));
router.get('/:id', asyncHandler(async (req, res) => {
  const ficha = await ownedFicha(req, id(req.params.id));
  const [[row]] = await pool.execute('SELECT * FROM ficha_treino WHERE id=?', [ficha.id]);
  res.json({ data: (await loadFichas([row]))[0] });
}));
router.post('/', requireRole('instrutor'), asyncHandler(async (req, res) => {
  const b = validate(fichaSchema, req.body);
  await canAccessStudent(req.user, b.aluno_id);
  const fichaId = await transaction(async (conn) => {
    const [f] = await conn.execute('INSERT INTO ficha_treino(aluno_id,nome,dia_semana) VALUES(?,?,?)', [b.aluno_id, b.nome, b.dia_semana]);
    for (const it of b.itens)
      await conn.execute('INSERT INTO item_ficha(ficha_id,exercicio_id,series,repeticoes,descanso_seg,carga_sugerida_kg,ordem) VALUES(?,?,?,?,?,?,?)', [f.insertId, it.exercicio_id, it.series, it.repeticoes, it.descanso_seg, it.carga_sugerida_kg ?? null, it.ordem]);
    return f.insertId;
  });
  res.status(201).json({ id: fichaId });
}));
router.put('/:id', requireRole('instrutor'), asyncHandler(async (req, res) => {
  const fichaId = id(req.params.id);
  const original = await ownedFicha(req, fichaId);
  const b = validate(fichaSchema, req.body);
  if (b.aluno_id !== original.aluno_id)
    throw new HttpError(400, 'Não é permitido transferir a ficha de aluno.');
  await transaction(async (conn) => {
    // Verifica propriedade dos itens sob lock e preserva os IDs não excluídos.
    const [existing] = await conn.execute('SELECT id,exercicio_id FROM item_ficha WHERE ficha_id=? AND removido_em IS NULL FOR UPDATE', [fichaId]);
    const byId = new Map(existing.map(it => [it.id, it]));
    const submittedIds = b.itens.filter(it => it.id !== undefined).map(it => it.id);
    if (new Set(submittedIds).size !== submittedIds.length || submittedIds.some(itemId => !byId.has(itemId)))
      throw new HttpError(400, 'Item inexistente ou duplicado na ficha.');
    await conn.execute('UPDATE ficha_treino SET nome=?,dia_semana=? WHERE id=?', [b.nome, b.dia_semana, fichaId]);
    for (const it of b.itens) {
      if (it.id) {
        if (byId.get(it.id).exercicio_id !== it.exercicio_id) {
          const [[history]] = await conn.execute('SELECT id FROM historico_carga WHERE item_ficha_id=? LIMIT 1', [it.id]);
          if (history)
            throw new HttpError(409, 'Este item tem histórico. Para trocar o exercício, adicione um novo item e mantenha o anterior.');
        }
        await conn.execute('UPDATE item_ficha SET exercicio_id=?,series=?,repeticoes=?,descanso_seg=?,carga_sugerida_kg=?,ordem=? WHERE id=?', [it.exercicio_id, it.series, it.repeticoes, it.descanso_seg, it.carga_sugerida_kg ?? null, it.ordem, it.id]);
      }
      else {
        await conn.execute('INSERT INTO item_ficha(ficha_id,exercicio_id,series,repeticoes,descanso_seg,carga_sugerida_kg,ordem) VALUES(?,?,?,?,?,?,?)', [fichaId, it.exercicio_id, it.series, it.repeticoes, it.descanso_seg, it.carga_sugerida_kg ?? null, it.ordem]);
      }
    }
    for (const item of existing.filter(it => !submittedIds.includes(it.id))) {
      await conn.execute('UPDATE item_ficha SET removido_em=NOW() WHERE id=?', [item.id]);
    }
  });
  res.json({ message: 'Ficha atualizada.' });
}));
router.delete('/:id', requireRole('instrutor'), asyncHandler(async (req, res) => {
  const fichaId = id(req.params.id);
  await ownedFicha(req, fichaId);
  await pool.execute('UPDATE ficha_treino SET arquivada_em=NOW() WHERE id=?', [fichaId]);
  res.json({ message: 'Ficha arquivada; histórico de cargas preservado.' });
}));
router.get('/:id/itens', asyncHandler(async (req, res) => {
  const ficha = await ownedFicha(req, id(req.params.id));
  const [rows] = await pool.execute('SELECT * FROM item_ficha WHERE ficha_id=? AND removido_em IS NULL ORDER BY ordem,id', [ficha.id]);
  res.json({ data: rows });
}));
router.post('/:id/itens', requireRole('instrutor'), asyncHandler(async (req, res) => {
  const ficha = await ownedFicha(req, id(req.params.id));
  const b = validate(itemSchema, req.body);
  const [r] = await pool.execute('INSERT INTO item_ficha(ficha_id,exercicio_id,series,repeticoes,descanso_seg,carga_sugerida_kg,ordem) VALUES(?,?,?,?,?,?,?)', [ficha.id, b.exercicio_id, b.series, b.repeticoes, b.descanso_seg, b.carga_sugerida_kg ?? null, b.ordem]);
  res.status(201).json({ id: r.insertId });
}));
router.put('/:id/itens/:itemId', requireRole('instrutor'), asyncHandler(async (req, res) => {
  const ficha = await ownedFicha(req, id(req.params.id));
  const it = await ownedItem(req, id(req.params.itemId));
  if (it.ficha_id !== ficha.id)
    throw new HttpError(404, 'Item não pertence à ficha.');
  const b = validate(itemSchema, req.body);
  if (it.exercicio_id !== b.exercicio_id) {
    const [[history]] = await pool.execute('SELECT id FROM historico_carga WHERE item_ficha_id=? LIMIT 1', [it.id]);
    if (history)
      throw new HttpError(409, 'Este item tem histórico e não pode mudar de exercício.');
  }
  await pool.execute('UPDATE item_ficha SET exercicio_id=?,series=?,repeticoes=?,descanso_seg=?,carga_sugerida_kg=?,ordem=? WHERE id=?', [b.exercicio_id, b.series, b.repeticoes, b.descanso_seg, b.carga_sugerida_kg ?? null, b.ordem, it.id]);
  res.json({ message: 'Item atualizado.' });
}));
router.delete('/:id/itens/:itemId', requireRole('instrutor'), asyncHandler(async (req, res) => {
  const ficha = await ownedFicha(req, id(req.params.id));
  const it = await ownedItem(req, id(req.params.itemId));
  if (it.ficha_id !== ficha.id)
    throw new HttpError(404, 'Item não pertence à ficha.');
  const [[row]] = await pool.execute('SELECT COUNT(*) AS total FROM item_ficha WHERE ficha_id=? AND removido_em IS NULL', [ficha.id]);
  if (row.total <= 1)
    throw new HttpError(400, 'A ficha precisa ter pelo menos um exercício.');
  await pool.execute('UPDATE item_ficha SET removido_em=NOW() WHERE id=?', [it.id]);
  res.json({ message: 'Item removido da ficha; histórico preservado.' });
}));
export default router;
