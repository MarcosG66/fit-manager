import mysql from 'mysql2/promise';

/**
 * Conexão compartilhada por todas as rotas.
 * Os dados da conexão vêm das variáveis de ambiente, nunca do front-end.
 *
 * DB_SSL=true é recomendado quando o MySQL está hospedado em nuvem.
 * A verificação de certificado continua ativa (rejectUnauthorized: true).
 */
export const dbOptions = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3307),
  user: process.env.DB_USER || 'fitmanager',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fitmanager',
  waitForConnections: true,
  connectionLimit: 5,
  maxIdle: 2,
  idleTimeout: 240000,
  timezone: 'Z',
  decimalNumbers: true,
  multipleStatements: false,
  dateStrings: true,
  ...(process.env.DB_SSL === 'true'
    ? {
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
        ...(process.env.DB_SSL_CA
          ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n') }
          : {}),
      },
    }
    : {}),
};

// Um pool reutiliza conexões e evita abrir uma conexão por requisição.
export const pool = mysql.createPool(dbOptions);

/**
 * Executa operações relacionadas em uma única transação.
 * Se houver erro, desfaz todas as operações anteriores (ROLLBACK).
 * A conexão é devolvida ao pool mesmo em caso de falha.
 */
export async function transaction(callback) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
