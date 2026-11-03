-- Execute UMA VEZ com um usuário MySQL que tenha permissão CREATE DATABASE.
-- Exemplo: mysql -u root -p < server/sql/create_database_local.sql
-- Não coloque senhas de usuários ou credenciais de produção neste arquivo.
CREATE DATABASE IF NOT EXISTS fitmanager
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

-- Em instalações locais sem Docker, crie o usuário pelo console do MySQL
-- com uma senha FORTE e configure DB_USER, DB_PASSWORD e DB_NAME no .env.
-- O esquema completo é criado pelo comando `npm run db:init`.
