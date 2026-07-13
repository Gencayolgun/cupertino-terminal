'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../src/zerolink-proto');

test('ZeroLink decoders reject truncated authenticated frames instead of crashing native event handlers', () => {
  assert.throws(() => P.decodeResize(Buffer.alloc(3)), /too short/);
  assert.throws(() => P.decodeFileMeta(Buffer.alloc(13)), /too short/);
  assert.throws(() => P.decodeFileChunk(Buffer.alloc(3)), /too short/);
  assert.throws(() => P.decodeU32(Buffer.alloc(0)), /too short/);
  assert.throws(() => P.decodeFwdData(Buffer.alloc(2)), /too short/);
});

test('ZeroLink file metadata enforces its encoded filename boundary', () => {
  const valid = P.encodeFileMeta({ id: 1, size: 12, name: 'a.txt' });
  assert.deepEqual(P.decodeFileMeta(valid), { id: 1, size: 12, name: 'a.txt' });
  assert.throws(() => P.decodeFileMeta(Buffer.concat([valid, Buffer.from('junk')])), /name length/);
});
