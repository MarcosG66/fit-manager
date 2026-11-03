import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashRecoveryCode,
  generateRecoveryCode,
  isRecoveryCodeUsable,
} from '../src/utils/recovery.js';

test('código de redefinição possui sempre oito dígitos, inclusive zeros iniciais', () => {
  for (let index = 0; index < 300; index += 1) {
    assert.match(generateRecoveryCode(), /^\d{8}$/);
  }
});

test('hash do código não revela os oito dígitos nem se repete em usuários diferentes', () => {
  const hash = hashRecoveryCode(10, '00012345', 'segredo-de-teste');
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.notEqual(hash, '00012345');
  assert.notEqual(hash, hashRecoveryCode(11, '00012345', 'segredo-de-teste'));
  assert.equal(hash, hashRecoveryCode(10, '00012345', 'segredo-de-teste'));
});

test('código dentro do prazo e abaixo do limite pode ser usado', () => {
  const agora = Date.parse('2026-11-03T12:00:00Z');
  assert.equal(isRecoveryCodeUsable({
    expira_em: '2026-11-03 12:00:01', tentativas: 4, utilizado_em: null,
  }, agora), true);
});

test('código expirado, já utilizado, tentativas esgotadas ou ausente é recusado', () => {
  const agora = Date.parse('2026-11-03T12:00:00Z');
  assert.equal(isRecoveryCodeUsable(null, agora), false);
  assert.equal(isRecoveryCodeUsable({ expira_em: '2026-11-03 12:00:00', tentativas: 0 }, agora), false);
  assert.equal(isRecoveryCodeUsable({ expira_em: '2026-11-03 12:10:00', tentativas: 5 }, agora), false);
  assert.equal(isRecoveryCodeUsable({
    expira_em: '2026-11-03 12:10:00', tentativas: 0, utilizado_em: '2026-11-03 11:00:00',
  }, agora), false);
  assert.equal(isRecoveryCodeUsable({ expira_em: 'data-invalida', tentativas: 0 }, agora), false);
});
