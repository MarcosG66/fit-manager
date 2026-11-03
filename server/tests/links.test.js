import test from 'node:test';
import assert from 'node:assert/strict';
import { createLinkCode } from '../src/utils/links.js';

test('código de vínculo tem exatamente 12 caracteres hexadecimais', () => {
  assert.match(createLinkCode(), /^[A-F0-9]{12}$/);
});

test('códigos de vínculo não se repetem na amostra de 200', () => {
  const codes = Array.from({ length: 200 }, () => createLinkCode());
  assert.equal(new Set(codes).size, codes.length);
});
