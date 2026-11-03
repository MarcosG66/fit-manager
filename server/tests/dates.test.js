import test from 'node:test';
import assert from 'node:assert/strict';
import { todayInAcademyTimezone } from '../src/utils/dates.js';

test('o dia local usa o fuso de Fortaleza em vez de UTC', () => {
  const date = new Date('2026-11-04T01:00:00Z');
  assert.equal(todayInAcademyTimezone(date), '2026-11-03');
});
