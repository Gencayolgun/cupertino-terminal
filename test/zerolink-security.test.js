'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { ZeroLinkPeer } = require('../src/zerolink-peer');
const { generateKeyPair, encrypt, decrypt } = require('../src/zerolink-crypto');

test('ZeroLink peer pins the remote public key supplied by the out-of-band code', () => {
  const peer = new ZeroLinkPeer();
  const key = generateKeyPair().publicKey;
  peer.expectRemotePublicKey(key);
  assert.deepEqual(peer._expectedRemotePublicKey, key);
  assert.throws(() => peer.expectRemotePublicKey(Buffer.alloc(12)), /public key/);
});

test('ZeroLink replay protection rejects a previously consumed packet', () => {
  const key = crypto.randomBytes(32);
  const packet = encrypt(key, Buffer.from('terminal-data'), 0n);
  assert.equal(decrypt(key, packet, 0n).plaintext.toString(), 'terminal-data');
  assert.throws(() => decrypt(key, packet, 1n), /Replay/);
});

test('ZeroLink ordered channel rejects skipped counters and malformed code characters', () => {
  const key = crypto.randomBytes(32);
  const future = encrypt(key, Buffer.from('future'), 2n);
  assert.throws(() => decrypt(key, future, 0n), /sıra bozulması/);
  const { decodeZeroCode } = require('../src/zerolink-crypto');
  assert.throws(() => decodeZeroCode('AAAA-!!!!'), /Base32/);
});
