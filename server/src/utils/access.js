import { pool } from '../config/db.js';
import { HttpError } from './http.js';

/** Busca o identificador de aluno associado ao usuário autenticado. */
export async function studentForUser(usuario, conexao = pool) {
  const [[aluno]] = await conexao.execute(
    'SELECT id FROM aluno WHERE usuario_id=?',
    [usuario.id],
  );

  if (!aluno) throw new HttpError(404, 'Cadastro de aluno não encontrado.');
  return aluno.id;
}

/** Busca o identificador de instrutor associado ao usuário autenticado. */
export async function instructorForUser(usuario, conexao = pool) {
  const [[instrutor]] = await conexao.execute(
    'SELECT id FROM instrutor WHERE usuario_id=?',
    [usuario.id],
  );

  if (!instrutor) throw new HttpError(404, 'Cadastro de instrutor não encontrado.');
  return instrutor.id;
}

/**
 * Confere quem pode acessar os dados de um aluno.
 * O aluno pode ver seus próprios registros; o instrutor, somente os vinculados a ele.
 * O administrador não tem acesso automático às fichas particulares.
 */
export async function canAccessStudent(usuario, alunoId, conexao = pool) {
  if (usuario.perfil === 'aluno') {
    const alunoAutenticadoId = await studentForUser(usuario, conexao);
    if (alunoAutenticadoId !== alunoId) {
      throw new HttpError(403, 'Acesso negado a este aluno.');
    }
    return;
  }

  if (usuario.perfil === 'instrutor') {
    const [[alunoVinculado]] = await conexao.execute(
      `SELECT aluno.id
       FROM aluno
       JOIN instrutor ON aluno.instrutor_id = instrutor.id
       WHERE aluno.id = ? AND instrutor.usuario_id = ?`,
      [alunoId, usuario.id],
    );

    if (!alunoVinculado) throw new HttpError(403, 'Aluno não vinculado ao instrutor.');
    return;
  }

  throw new HttpError(403, 'Acesso negado.');
}

/** Confere a existência da ficha e a autorização do usuário que a solicitou. */
export async function ownedFicha(req, fichaId, conexao = pool) {
  const [[ficha]] = await conexao.execute(
    'SELECT id,aluno_id FROM ficha_treino WHERE id=? AND arquivada_em IS NULL',
    [fichaId],
  );

  if (!ficha) throw new HttpError(404, 'Ficha não encontrada.');

  await canAccessStudent(req.user, ficha.aluno_id, conexao);
  return ficha;
}

/** Confere a existência de um exercício da ficha e seu proprietário. */
export async function ownedItem(req, itemId, conexao = pool) {
  const [[item]] = await conexao.execute(
    `SELECT item_ficha.id, item_ficha.ficha_id, item_ficha.exercicio_id,
            ficha_treino.aluno_id
     FROM item_ficha
     JOIN ficha_treino ON item_ficha.ficha_id = ficha_treino.id
     WHERE item_ficha.id = ? AND item_ficha.removido_em IS NULL
       AND ficha_treino.arquivada_em IS NULL`,
    [itemId],
  );

  if (!item) throw new HttpError(404, 'Item não encontrado.');

  await canAccessStudent(req.user, item.aluno_id, conexao);
  return item;
}
