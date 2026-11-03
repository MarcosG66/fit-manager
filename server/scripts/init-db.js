import 'dotenv/config';
import fs from 'node:fs/promises';
import { createConnection } from 'mysql2/promise';
import { dbOptions, pool } from '../src/config/db.js';
import { migrate } from './migrate-db.js';
// Executar a migração inicial somente com SQL confiável, nunca entrada do usuário.
const sql = await fs.readFile(new URL('../sql/schema.sql', import.meta.url), 'utf8');
const connection = await createConnection({ ...dbOptions, multipleStatements: true });
try {
  await connection.query(sql);
  await migrate();
  console.log('Banco FitManager inicializado e atualizado, sem apagar dados existentes.');
}
finally {
  await connection.end();
  await pool.end();
}
