-- FitManager: nove entidades do MER + tabelas técnicas para sessões de treino e redefinição.
CREATE TABLE IF NOT EXISTS usuario (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(130) NOT NULL,
 email VARCHAR(190) NOT NULL UNIQUE,
 senha_hash VARCHAR(255) NOT NULL,
 token_version INT UNSIGNED NOT NULL DEFAULT 0,
 ativo BOOLEAN NOT NULL DEFAULT TRUE,
 perfil ENUM('aluno','instrutor','admin') NOT NULL,
 criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS instrutor (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 usuario_id INT UNSIGNED NOT NULL UNIQUE,
 codigo_vinculo CHAR(12) NULL UNIQUE,
 CONSTRAINT fk_inst_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS aluno (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 usuario_id INT UNSIGNED NOT NULL UNIQUE,
 instrutor_id INT UNSIGNED NULL,
 objetivo VARCHAR(200) NOT NULL DEFAULT '',
 plano VARCHAR(100) NOT NULL DEFAULT '',
 data_ingresso DATE NOT NULL,
 status ENUM('ativo','inativo') NOT NULL DEFAULT 'ativo',
 CONSTRAINT fk_aluno_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
 CONSTRAINT fk_aluno_instrutor FOREIGN KEY (instrutor_id) REFERENCES instrutor(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS grupo_muscular (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(100) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS exercicio (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 grupo_id INT UNSIGNED NOT NULL,
 nome VARCHAR(160) NOT NULL,
 descricao TEXT NOT NULL,
 CONSTRAINT fk_ex_grupo FOREIGN KEY (grupo_id) REFERENCES grupo_muscular(id) ON DELETE RESTRICT,
 INDEX idx_ex_nome (nome)
);
CREATE TABLE IF NOT EXISTS ficha_treino (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 aluno_id INT UNSIGNED NOT NULL,
 nome VARCHAR(120) NOT NULL,
 dia_semana TINYINT UNSIGNED NOT NULL COMMENT '0=domingo, 1=segunda, ..., 6=sabado',
 criada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 arquivada_em DATETIME NULL,
 CONSTRAINT fk_ficha_aluno FOREIGN KEY (aluno_id) REFERENCES aluno(id) ON DELETE CASCADE,
 CONSTRAINT chk_dia CHECK (dia_semana BETWEEN 0 AND 6)
);
CREATE TABLE IF NOT EXISTS item_ficha (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 ficha_id INT UNSIGNED NOT NULL,
 exercicio_id INT UNSIGNED NOT NULL,
 series TINYINT UNSIGNED NOT NULL,
 repeticoes VARCHAR(30) NOT NULL,
 descanso_seg SMALLINT UNSIGNED NOT NULL DEFAULT 60,
 carga_sugerida_kg DECIMAL(7,2) NULL,
 ordem SMALLINT UNSIGNED NOT NULL DEFAULT 0,
 removido_em DATETIME NULL,
 CONSTRAINT fk_item_ficha FOREIGN KEY (ficha_id) REFERENCES ficha_treino(id) ON DELETE CASCADE,
 CONSTRAINT fk_item_ex FOREIGN KEY (exercicio_id) REFERENCES exercicio(id) ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS avaliacao_fisica (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 aluno_id INT UNSIGNED NOT NULL,
 peso_kg DECIMAL(6,2) NOT NULL,
 altura_m DECIMAL(4,2) NOT NULL,
 data_avaliacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_av_aluno FOREIGN KEY (aluno_id) REFERENCES aluno(id) ON DELETE CASCADE,
 INDEX idx_av_data (aluno_id,data_avaliacao)
);
CREATE TABLE IF NOT EXISTS historico_carga (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 aluno_id INT UNSIGNED NOT NULL,
 item_ficha_id INT UNSIGNED NOT NULL,
 carga_kg DECIMAL(7,2) NOT NULL,
 registrada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_hist_aluno FOREIGN KEY (aluno_id) REFERENCES aluno(id) ON DELETE CASCADE,
 CONSTRAINT fk_hist_item FOREIGN KEY (item_ficha_id) REFERENCES item_ficha(id) ON DELETE CASCADE,
 INDEX idx_hist_aluno_data (aluno_id,registrada_em),
 INDEX idx_hist_item_data (item_ficha_id,registrada_em)
);
-- Extra técnico: conclusão diária não é sinônimo de registro de carga.
CREATE TABLE IF NOT EXISTS conclusao_exercicio (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 aluno_id INT UNSIGNED NOT NULL,
 item_ficha_id INT UNSIGNED NOT NULL,
 dia DATE NOT NULL,
 concluido BOOLEAN NOT NULL DEFAULT TRUE,
 UNIQUE KEY unq_conclusao (item_ficha_id,dia),
 CONSTRAINT fk_con_aluno FOREIGN KEY (aluno_id) REFERENCES aluno(id) ON DELETE CASCADE,
 CONSTRAINT fk_con_item FOREIGN KEY (item_ficha_id) REFERENCES item_ficha(id) ON DELETE CASCADE
);
-- Extra técnico: código de 8 dígitos armazenado somente como HMAC.
CREATE TABLE IF NOT EXISTS redefinicao_senha (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 usuario_id INT UNSIGNED NOT NULL,
 codigo_hash CHAR(64) NOT NULL,
 expira_em DATETIME NOT NULL,
 tentativas TINYINT UNSIGNED NOT NULL DEFAULT 0,
 utilizado_em DATETIME NULL,
 criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_reset_user FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
 INDEX idx_reset_user (usuario_id,criado_em)
);

-- Dados anteriores do MVP são preservados por migrations/migrate-db.js.
