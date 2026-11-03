import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';

import { pool, transaction } from '../config/db.js';
import { HttpError, asyncHandler, validate } from '../utils/http.js';
import { authenticate, signSession, clearSession } from '../middleware/auth.js';
import { sendResetCode } from '../services/mail.js';
import { createLinkCode } from '../utils/links.js';
import { hashRecoveryCode, generateRecoveryCode, isRecoveryCodeUsable } from '../utils/recovery.js';

const router = Router();
const SALT_ROUNDS = 12;

// Todas as rotas de autenticação utilizam o mesmo formato de e-mail e senha.
const emailSchema = z.string().trim().email().max(190).transform(email => email.toLowerCase());
const passwordSchema = z.string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres.')
  .max(72);

const registerSchema = z.object({
  nome: z.string().trim().min(2).max(130),
  email: emailSchema,
  senha: passwordSchema,
  perfil: z.enum(['aluno', 'instrutor', 'admin']),
  codigoAdmin: z.string().max(200).optional(),
  codigoInstrutor: z.string().trim().max(20).optional(),
  objetivo: z.string().max(200).optional(),
  plano: z.string().max(100).optional(),
}).strict();

const loginSchema = z.object({
  email: emailSchema,
  senha: z.string().min(1),
});

const resetPasswordSchema = z.object({
  email: emailSchema,
  codigo: z.string().regex(/^\d{8}$/, 'Informe os 8 dígitos.'),
  novaSenha: passwordSchema,
});

// Cada fluxo possui seu próprio limite, evitando que operações diferentes
// consumam a mesma cota. Os limites são aplicados por IP neste MVP.
// Para múltiplas instâncias de produção, use um store compartilhado (Redis).
const WINDOW_MS = 15 * 60 * 1000;

const loginRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Muitas tentativas de login. Aguarde até 15 minutos e tente novamente.',
  },
});

const registerRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitos cadastros. Tente novamente mais tarde.' },
});

const recoveryRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Aguarde antes de solicitar outro código.' },
});

const resetPasswordRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de redefinição. Aguarde 15 minutos.' },
});

const changePasswordRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de alterar a senha. Aguarde 15 minutos.' },
});

router.post('/register', registerRateLimiter, asyncHandler(async (req, res) => {
  const dados = validate(registerSchema, req.body);
  // Cadastro de administrador exige código privado configurado no servidor.
  // O código NÃO é enviado ao front-end nem armazenado no banco.
  if (dados.perfil === 'admin') {
    const segredo = process.env.ADMIN_SIGNUP_CODE || '';
    const informado = dados.codigoAdmin || '';
    if (segredo.length < 24 || !informado ||
        !crypto.timingSafeEqual(
          crypto.createHash('sha256').update(segredo).digest(),
          crypto.createHash('sha256').update(informado).digest(),
        )) {
      throw new HttpError(403, 'Código de cadastro administrativo inválido.');
    }
  }


  const [usuariosExistentes] = await pool.execute(
    'SELECT id FROM usuario WHERE email=? LIMIT 1',
    [dados.email],
  );
  if (usuariosExistentes.length > 0) {
    throw new HttpError(409, 'E-mail já cadastrado.');
  }

  // bcrypt gera um hash com salt: a senha original não será armazenada.
  const senhaHash = await bcrypt.hash(dados.senha, SALT_ROUNDS);

  // As inserções são atômicas: se a segunda falhar, a primeira é desfeita.
  const usuario = await transaction(async conexao => {
    const [resultado] = await conexao.execute(
      'INSERT INTO usuario(nome,email,senha_hash,perfil) VALUES(?,?,?,?)',
      [dados.nome, dados.email, senhaHash, dados.perfil],
    );

    if (dados.perfil === 'aluno') {
      let instrutorId = null;
      if (dados.codigoInstrutor?.trim()) {
        const [[instrutor]] = await conexao.execute(
          `SELECT i.id FROM instrutor i JOIN usuario u ON u.id=i.usuario_id
           WHERE i.codigo_vinculo=? AND u.ativo=1`,
          [dados.codigoInstrutor.trim().toUpperCase()],
        );
        if (!instrutor) throw new HttpError(400, 'Código do instrutor inválido.');
        instrutorId = instrutor.id;
      }
      await conexao.execute(
        'INSERT INTO aluno(usuario_id,instrutor_id,objetivo,plano,data_ingresso) VALUES(?,?,?,?,CURRENT_DATE())',
        [resultado.insertId, instrutorId, dados.objetivo || '', dados.plano || ''],
      );
    } else if (dados.perfil === 'instrutor') {
      await conexao.execute(
        'INSERT INTO instrutor(usuario_id,codigo_vinculo) VALUES(?,?)',
        [resultado.insertId, createLinkCode()],
      );
    }

    return {
      id: resultado.insertId,
      nome: dados.nome,
      email: dados.email,
      perfil: dados.perfil,
    };
  });

  signSession(res, usuario);
  res.status(201).json({ user: usuario });
}));

router.post('/login', loginRateLimiter, asyncHandler(async (req, res) => {
  const credenciais = validate(loginSchema, req.body);

  const [[usuarioEncontrado]] = await pool.execute(
    'SELECT id,nome,email,perfil,senha_hash,token_version,ativo FROM usuario WHERE email=?',
    [credenciais.email],
  );

  const senhaCorreta = usuarioEncontrado && await bcrypt.compare(
    credenciais.senha,
    usuarioEncontrado.senha_hash,
  );

  if (!senhaCorreta) {
    throw new HttpError(401, 'E-mail ou senha incorretos.');
  }

  if (!usuarioEncontrado.ativo) {
    throw new HttpError(403, 'Conta desativada. Contate a administração.');
  }

  if (usuarioEncontrado.perfil === 'aluno') {
    const [[aluno]] = await pool.execute(
      'SELECT status FROM aluno WHERE usuario_id=?',
      [usuarioEncontrado.id],
    );
    if (aluno?.status === 'inativo') {
      throw new HttpError(403, 'Conta inativa. Contate o instrutor.');
    }
  }

  const usuario = {
    id: usuarioEncontrado.id,
    nome: usuarioEncontrado.nome,
    email: usuarioEncontrado.email,
    perfil: usuarioEncontrado.perfil,
    token_version: usuarioEncontrado.token_version,
  };

  // signSession gera o JWT, mas o navegador o recebe em cookie httpOnly.
  signSession(res, usuario);
  res.json({ user: usuario });
}));

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

router.post('/logout', (req, res) => {
  clearSession(res);
  res.json({ message: 'Sessão encerrada.' });
});

router.post('/forgot-password', recoveryRateLimiter, asyncHandler(async (req, res) => {
  const { email } = validate(z.object({ email: emailSchema }), req.body);

  if (!process.env.SMTP_HOST && !process.env.RESEND_API_KEY) {
    throw new HttpError(503, 'Serviço de e-mail não configurado.');
  }

  const [[usuario]] = await pool.execute(
    'SELECT id,email FROM usuario WHERE email=?',
    [email],
  );

  // A resposta é idêntica para e-mails cadastrados e desconhecidos.
  // Isso não revela quem possui conta no sistema.
  const respostaGenerica = {
    message: 'Se o e-mail estiver cadastrado, você receberá um código de 8 dígitos.',
  };

  if (!usuario) return res.json(respostaGenerica);

  const [[ultimoCodigo]] = await pool.execute(
    'SELECT criado_em FROM redefinicao_senha WHERE usuario_id=? ORDER BY id DESC LIMIT 1',
    [usuario.id],
  );

  const ultimoEnvio = ultimoCodigo && new Date(ultimoCodigo.criado_em + 'Z').getTime();
  if (ultimoEnvio && Date.now() - ultimoEnvio < 60_000) {
    return res.json(respostaGenerica);
  }

  const codigo = generateRecoveryCode();
  const codigoHash = hashRecoveryCode(usuario.id, codigo);

  // Primeiro persiste o código: nunca chega um e-mail com um código ainda inexistente.
  // Se o serviço de e-mail falhar, excluímos apenas o novo registro. O código
  // anterior continua utilizável enquanto não expirar.
  const [novoCodigo] = await pool.execute(
    'INSERT INTO redefinicao_senha(usuario_id,codigo_hash,expira_em) VALUES(?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 10 MINUTE))',
    [usuario.id, codigoHash],
  );

  try {
    await sendResetCode(usuario.email, codigo);
  } catch (erroEnvio) {
    try {
      await pool.execute('DELETE FROM redefinicao_senha WHERE id=?', [novoCodigo.insertId]);
    } catch (erroLimpeza) {
      console.error('[AUTH] Falha ao remover código não enviado:', erroLimpeza);
    }
    throw erroEnvio;
  }

  await pool.execute(
    'UPDATE redefinicao_senha SET utilizado_em=UTC_TIMESTAMP() WHERE usuario_id=? AND id<>? AND utilizado_em IS NULL',
    [usuario.id, novoCodigo.insertId],
  );

  res.json(respostaGenerica);
}));

router.post('/reset-password', resetPasswordRateLimiter, asyncHandler(async (req, res) => {
  const dados = validate(resetPasswordSchema, req.body);

  const [[usuario]] = await pool.execute(
    'SELECT id FROM usuario WHERE email=?',
    [dados.email],
  );
  if (!usuario) throw new HttpError(400, 'Código inválido ou expirado.');

  const novaSenhaHash = await bcrypt.hash(dados.novaSenha, SALT_ROUNDS);

  // Retorna true quando a senha foi alterada. Em caso de código incorreto,
  // a transação confirma o incremento de tentativas (não faz rollback).
  const senhaRedefinida = await transaction(async conexao => {
    const [[registro]] = await conexao.execute(
      'SELECT * FROM redefinicao_senha WHERE usuario_id=? AND utilizado_em IS NULL ORDER BY id DESC LIMIT 1 FOR UPDATE',
      [usuario.id],
    );

    if (!isRecoveryCodeUsable(registro)) {
      throw new HttpError(400, 'Código inválido ou expirado.');
    }

    // Comparação em tempo constante: não vaza informações por duração.
    const codigoInformadoHash = hashRecoveryCode(usuario.id, dados.codigo);
    const codigoCorreto = crypto.timingSafeEqual(
      Buffer.from(registro.codigo_hash, 'hex'),
      Buffer.from(codigoInformadoHash, 'hex'),
    );

    if (!codigoCorreto) {
      await conexao.execute(
        'UPDATE redefinicao_senha SET tentativas=tentativas+1 WHERE id=?',
        [registro.id],
      );
      return false;
    }

    await conexao.execute(
      'UPDATE usuario SET senha_hash=?,token_version=token_version+1 WHERE id=?',
      [novaSenhaHash, usuario.id],
    );
    await conexao.execute(
      'UPDATE redefinicao_senha SET utilizado_em=UTC_TIMESTAMP() WHERE usuario_id=? AND utilizado_em IS NULL',
      [usuario.id],
    );
    return true;
  });

  if (!senhaRedefinida) {
    throw new HttpError(400, 'Código inválido ou expirado.');
  }

  clearSession(res);
  res.json({ message: 'Senha redefinida. Faça login novamente.' });
}));


// Atualização da própria conta, sem permitir mudar perfil ou ID.
const profileSchema = z.object({
  nome: z.string().trim().min(2).max(130),
  email: emailSchema,
  objetivo: z.string().max(200).optional(),
  plano: z.string().max(100).optional(),
}).strict();

router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  const [[user]] = await pool.execute('SELECT id,nome,email,perfil FROM usuario WHERE id=?', [req.user.id]);
  if (user.perfil === 'aluno') {
    const [[student]] = await pool.execute(
      'SELECT objetivo,plano,status FROM aluno WHERE usuario_id=?', [user.id]);
    return res.json({ data: { ...user, ...student } });
  }
  res.json({ data: user });
}));

router.put('/profile', authenticate, asyncHandler(async (req, res) => {
  const data = validate(profileSchema, req.body);
  await transaction(async connection => {
    await connection.execute('UPDATE usuario SET nome=?,email=? WHERE id=?', [data.nome, data.email, req.user.id]);
    if (req.user.perfil === 'aluno') {
      await connection.execute(
        'UPDATE aluno SET objetivo=COALESCE(?,objetivo),plano=COALESCE(?,plano) WHERE usuario_id=?',
        [data.objetivo ?? null, data.plano ?? null, req.user.id],
      );
    }
  });
  res.json({ message: 'Perfil atualizado.' });
}));

router.put('/password', authenticate, changePasswordRateLimiter, asyncHandler(async (req, res) => {
  const data = validate(z.object({
    senhaAtual: z.string().min(1),
    novaSenha: passwordSchema,
  }).strict(), req.body);
  const [[user]] = await pool.execute(
    'SELECT id,senha_hash FROM usuario WHERE id=?', [req.user.id],
  );
  if (!await bcrypt.compare(data.senhaAtual, user.senha_hash)) {
    throw new HttpError(400, 'Senha atual incorreta.');
  }
  if (await bcrypt.compare(data.novaSenha, user.senha_hash)) {
    throw new HttpError(400, 'A nova senha deve ser diferente da atual.');
  }
  const hash = await bcrypt.hash(data.novaSenha, SALT_ROUNDS);
  await pool.execute(
    'UPDATE usuario SET senha_hash=?,token_version=token_version+1 WHERE id=?',
    [hash, user.id],
  );
  clearSession(res);
  res.json({ message: 'Senha atualizada. Faça login novamente.' });
}));

export default router;
