import 'dotenv/config';
import { createLinkCode } from '../src/utils/links.js';
import { pool } from '../src/config/db.js';

/** Migração incremental: não apaga nem recria tabelas existentes. */
async function columnExists(table, column) {
  const [[record]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  return record.total > 0;
}

async function addColumnIfMissing(table, column, definition) {
  if (await columnExists(table, column)) return;
  // Nomes e definições vêm exclusivamente deste arquivo (nunca do usuário).
  await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  console.log(`Coluna adicionada: ${table}.${column}`);
}

export async function migrate() {
  await addColumnIfMissing('usuario', 'ativo', 'BOOLEAN NOT NULL DEFAULT TRUE');
  await addColumnIfMissing('instrutor', 'codigo_vinculo', 'CHAR(12) NULL UNIQUE');
  await addColumnIfMissing('ficha_treino', 'arquivada_em', 'DATETIME NULL');
  await addColumnIfMissing('item_ficha', 'removido_em', 'DATETIME NULL');

  const [instructors] = await pool.query('SELECT id FROM instrutor WHERE codigo_vinculo IS NULL');
  for (const instructor of instructors) {
    await pool.execute('UPDATE instrutor SET codigo_vinculo=? WHERE id=?', [createLinkCode(), instructor.id]);
  }
  console.log(`Migração concluída; ${instructors.length} código(s) de instrutor gerado(s).`);
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('/migrate-db.js')) {
  try { await migrate(); } finally { await pool.end(); }
}
