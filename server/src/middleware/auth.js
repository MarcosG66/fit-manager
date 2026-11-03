import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { HttpError, asyncHandler } from '../utils/http.js';

export const COOKIE = 'fm_token';

// O navegador envia o cookie automaticamente à API.
// httpOnly impede acesso via JavaScript; secure exige HTTPS em produção.
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api',
  maxAge: 8 * 60 * 60 * 1000,
};

/** Lê o JWT e verifica se a conta ainda é válida no MySQL. */
export const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[COOKIE];
  if (!token) throw new HttpError(401, 'Sessão não autenticada.');

  let tokenPayload;
  try {
    tokenPayload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });
  } catch {
    throw new HttpError(401, 'Sessão expirada ou inválida.');
  }

  const [[usuario]] = await pool.execute(
    'SELECT id,nome,email,perfil,token_version,ativo FROM usuario WHERE id=?',
    [tokenPayload.sub],
  );

  // A versão do token muda quando a senha é redefinida.
  // Isso invalida JWTs antigos, mesmo antes do prazo de expiração.
  const sessaoInvalida = !usuario
    || !usuario.ativo
    || usuario.perfil !== tokenPayload.role
    || usuario.token_version !== tokenPayload.ver;

  if (sessaoInvalida) throw new HttpError(401, 'Sessão inválida.');

  if (usuario.perfil === 'aluno') {
    const [[aluno]] = await pool.execute(
      'SELECT status FROM aluno WHERE usuario_id=?',
      [usuario.id],
    );
    if (aluno?.status === 'inativo') {
      throw new HttpError(403, 'Conta inativa.');
    }
  }

  req.user = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
  };
  next();
});

/** Autoriza a rota somente para os perfis informados. */
export const requireRole = (...perfisPermitidos) => (req, res, next) => {
  if (perfisPermitidos.includes(req.user?.perfil)) return next();
  return next(new HttpError(403, 'Seu perfil não possui permissão.'));
};

/** Gera o JWT e o envia no cookie; o token não aparece no JSON da resposta. */
export function signSession(res, usuario) {
  const token = jwt.sign(
    { role: usuario.perfil, ver: usuario.token_version || 0 },
    process.env.JWT_SECRET,
    {
      subject: String(usuario.id),
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      algorithm: 'HS256',
    },
  );

  res.cookie(COOKIE, token, cookieOptions);
}

export function clearSession(res) {
  res.clearCookie(COOKIE, { ...cookieOptions, maxAge: undefined });
}
