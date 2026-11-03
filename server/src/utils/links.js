import crypto from 'node:crypto';
/** Código compartilhável com o aluno para relacioná-lo ao instrutor. */
export function createLinkCode() {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}
