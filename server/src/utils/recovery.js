import crypto from 'node:crypto';

const TAMANHO_CODIGO = 8;
const MAX_TENTATIVAS = 5;

/** Guarda um HMAC do código, nunca os oito dígitos em texto puro. */
export function hashRecoveryCode(usuarioId, codigo, segredo = process.env.RESET_SECRET) {
  if (!segredo) throw new Error('RESET_SECRET não configurado.');
  return crypto.createHmac('sha256', segredo)
    .update(`${usuarioId}:${codigo}`)
    .digest('hex');
}

/** Gera oito dígitos criptograficamente aleatórios, mantendo zeros à esquerda. */
export function generateRecoveryCode() {
  return crypto.randomInt(0, 10 ** TAMANHO_CODIGO)
    .toString()
    .padStart(TAMANHO_CODIGO, '0');
}

/** Compara a expiração UTC recebida do MySQL com a data atual. */
export function isRecoveryCodeUsable(registro, now = Date.now()) {
  if (!registro || registro.utilizado_em || Number(registro.tentativas) >= MAX_TENTATIVAS) {
    return false;
  }

  const expirationUtc = new Date(String(registro.expira_em).replace(' ', 'T') + 'Z');
  return Number.isFinite(expirationUtc.getTime()) && expirationUtc.getTime() > now;
}
