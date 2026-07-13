'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeTabId, normalizeDimensions, normalizePtyInput } = require('../src/pty-params');

test('PTY identifiers reject dynamic-channel injection characters', () => {
  assert.equal(normalizeTabId('tab_12-a'), 'tab_12-a');
  assert.throws(() => normalizeTabId('tab:12'));
  assert.throws(() => normalizeTabId('../tab'));
});

test('PTY dimensions are finite integers bounded away from native crashes', () => {
  assert.deepEqual(normalizeDimensions(-10, Infinity), { cols: 1, rows: 30 });
  assert.deepEqual(normalizeDimensions(99999, 99999), { cols: 1000, rows: 500 });
  assert.deepEqual(normalizeDimensions('120', '40'), { cols: 120, rows: 40 });
});

test('PTY input rejects non-text and bounds a single IPC payload', () => {
  assert.equal(normalizePtyInput(Buffer.from('x')), null);
  assert.equal(normalizePtyInput('ok'), 'ok');
  assert.equal(normalizePtyInput('x'.repeat(1024 * 1024 + 5)).length, 1024 * 1024);
});
