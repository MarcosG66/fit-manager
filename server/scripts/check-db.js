import 'dotenv/config';
import { pool } from '../src/config/db.js';
try {
  const [[db]] = await pool.query('SELECT DATABASE() AS banco, VERSION() AS versao');
  const [tables] = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name`);
  console.log(`MySQL conectado: ${db.banco} | ${db.versao}`);
  console.log(`Tabelas: ${tables.map(item => item.TABLE_NAME || item.table_name).join(', ')}`);
  if (tables.length < 11) {
    console.error('Banco incompleto: execute npm run db:init para criar as tabelas.');
    process.exitCode = 1;
  }
} catch (error) {
  console.error('Falha ao conectar ao MySQL:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
