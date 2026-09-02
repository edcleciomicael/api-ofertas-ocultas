const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { readTokens, writeTokens } = require('../tokenStore');

test('persiste e recupera tokens sem alterar os dados', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ofertas-ocultas-'));
  process.env.MELI_TOKEN_FILE = path.join(directory, 'meli-tokens.json');
  const tokens = { accessToken: 'access', refreshToken: 'refresh', expiresAt: 12345 };
  assert.equal(writeTokens(tokens), true);
  assert.deepEqual(readTokens(), tokens);
  fs.rmSync(directory, { recursive: true, force: true });
  delete process.env.MELI_TOKEN_FILE;
});

test('funciona sem persistência quando MELI_TOKEN_FILE não está configurada', () => {
  delete process.env.MELI_TOKEN_FILE;
  assert.equal(writeTokens({ accessToken: 'x' }), false);
  assert.equal(readTokens(), null);
});
