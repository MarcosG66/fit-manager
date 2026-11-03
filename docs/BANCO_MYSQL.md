# Banco de dados MySQL — FitManager final

## Onde ficam os dados?

Todas as informações são persistidas em **MySQL 8.4**. A conexão fica apenas no Express (`server/src/config/db.js`), via `mysql2/promise`. Os arquivos `.env` contêm as credenciais locais e não devem ser versionados. O React recebe somente as respostas JSON.

## Tabelas

| Entidade | Responsabilidade |
|---|---|
| `usuario` | Nome, e-mail único, bcrypt, perfil, status ativo e versão do token JWT |
| `instrutor` | Especialização 1:1 do usuário instrutor e código exclusivo para vincular alunos |
| `aluno` | Especialização 1:1 do usuário aluno, instrutor vinculado, objetivo, plano, status |
| `grupo_muscular` | Categorias de exercícios |
| `exercicio` | Catálogo de exercícios e descrições |
| `ficha_treino` | Treino associado ao aluno e ao dia; pode ser arquivado |
| `item_ficha` | Séries, repetições, descanso e carga sugerida, com opção de remoção lógica |
| `avaliacao_fisica` | Peso, altura e data; IMC calculado em consulta SQL |
| `historico_carga` | Cargas registradas, com data, exercício da ficha e aluno |
| `conclusao_exercicio` | Conclusão por dia e item, com restrição de unicidade |
| `redefinicao_senha` | Código de recuperação armazenado em HMAC, tentativas, validade |

As nove primeiras entidades correspondem ao MER do plano, e as últimas duas são auxiliares. As alterações finais são colunas acrescentadas às tabelas existentes. O arquivo oficial de estrutura é `server/sql/schema.sql`.

## Criar o banco com Docker

```bash
docker compose up -d --wait
npm run db:init
npm run db:check
```

No Docker Compose, `MYSQL_DATABASE=fitmanager` prepara o banco inicialmente e o servidor é acessível pelo Windows em `127.0.0.1:3307`. A senha vem do Compose (configure outra para ambientes não locais). Os dados ficam no volume persistente `mysql_data`.

Para ver as tabelas pelo próprio Docker:

```bash
docker compose exec mysql mysql -ufitmanager -p fitmanager
SHOW TABLES;
DESCRIBE usuario;
DESCRIBE ficha_treino;
```

Ao pedir senha, digite a senha de `MYSQL_PASSWORD`. Se estiver usando a configuração de desenvolvimento padrão, ela está indicada no `server/.env` (não no navegador).

## Criar MySQL sem Docker

MySQL Workbench ou CLI:

```bash
mysql -u root -p < server/sql/create_database_local.sql
```

No console MySQL, **substitua a senha do exemplo por uma senha privada**:

```sql
CREATE USER IF NOT EXISTS 'fitmanager_app'@'localhost' IDENTIFIED BY 'SUBSTITUA_POR_SENHA_FORTE';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
ON fitmanager.* TO 'fitmanager_app'@'localhost';
```

Configure a aplicação (`server/.env`) com `DB_PORT=3306`, `DB_USER=fitmanager_app`, `DB_PASSWORD=...`, `DB_NAME=fitmanager` e execute `npm run db:init`.

Em um MySQL externo gerenciado, crie o banco pelo painel do provedor (a conta pode não ter permissão CREATE DATABASE), configure os dados no painel da hospedagem e habilite TLS se necessário (`DB_SSL=true`, `DB_SSL_CA=...`).

## Inicializar e atualizar

- `npm run db:init`: executa `server/sql/schema.sql` e depois a migração incremental. É seguro para as tabelas existentes, mas faça backup antes de migrar dados importantes.
- `npm run db:migrate`: acrescenta colunas novas ao esquema do MVP, **pressupõe que as tabelas já existem**.
- `npm run db:check`: confirma conexão e lista as tabelas.
- `npm run db:seed`: **opcional**; insere dados de exemplo, sem apagar dados existentes. Nunca execute o seed em produção se não quiser contas fictícias.

## Backup e restauração

No Windows com MySQL instalado:

```bash
mysqldump -h 127.0.0.1 -P 3307 -u fitmanager -p --single-transaction fitmanager > fitmanager-backup.sql
```

Se você usa apenas o contêiner e não tem `mysqldump` no Windows:

```bash
docker compose exec -T mysql sh -c 'exec mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --single-transaction fitmanager' > fitmanager-backup.sql
```

Para restaurar em um banco **vazio** (atenção: uma restauração altera dados):

```bash
docker compose exec -T mysql sh -c 'exec mysql -u root -p"$MYSQL_ROOT_PASSWORD" fitmanager' < fitmanager-backup.sql
```

Não coloque backups reais no GitHub. Nunca execute `docker compose down -v` sobre um banco que deseja preservar.

### Atenção ao trocar a pasta do MVP para a versão final

Por padrão, o Docker Compose identifica o projeto pelo nome da pasta. Se o MVP estava em `FitManager-MVP` e a versão final foi extraída em `FitManager-Versao-Final`, os dois podem ter **volumes distintos** e os dados antigos não aparecerão automaticamente.

Para preservar o banco, você pode:

1. Fazer backup com `mysqldump` no projeto original.
2. Parar o contêiner antigo com `docker compose down` (sem `-v`).
3. Iniciar o MySQL na pasta nova, restaurar o `.sql` no banco novo e executar `npm run db:init` para aplicar a migração final.

Ou copiar os arquivos finais por cima da pasta original, mantendo o mesmo nome de projeto/volume. Confira os volumes disponíveis com `docker volume ls` e evite iniciar dois MySQLs ao mesmo tempo na porta `3307`.

## Integridade

- PKs com `AUTO_INCREMENT`, FKs para evitar referências inexistentes, `UNIQUE` para e-mails e códigos de vínculo.
- Transações para cadastro e atualização de fichas; `ROLLBACK` desfaz operações incompletas.
- Consultas SQL parametrizadas (`?`) para entradas de usuários, reduzindo risco de SQL Injection.
- Arquivamento lógico de fichas e itens impede a perda de histórico por mudanças de prescrição.
- Desativar usuários incrementa `token_version`; JWTs emitidos anteriormente deixam de ser válidos.
