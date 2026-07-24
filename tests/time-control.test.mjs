import assert from 'node:assert/strict';
import test from 'node:test';

import { localInputValue, parsePastLocalTime } from '../src/time-control.mjs';

test('parses a datetime-local value as local time rather than its raw input number', () => {
  const value = '2026-07-24T13:17';
  const now = new Date('2026-07-24T13:20').getTime();
  assert.equal(parsePastLocalTime(value, now), new Date(value).getTime());
});

test('formats datetime-local values through epoch arithmetic across offset changes', () => {
  const timestamp = Date.parse('2026-03-08T07:30:00Z');
  const date = new Date(timestamp);
  const expected = new Date(timestamp - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  assert.equal(localInputValue(timestamp), expected);
});

test('rejects invalid and future custom start times', () => {
  const now = new Date('2026-07-24T13:20').getTime();
  assert.equal(parsePastLocalTime('', now), null);
  assert.equal(parsePastLocalTime('2026-07-24T13:21', now), null);
});
