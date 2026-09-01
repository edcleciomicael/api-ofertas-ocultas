const fs = require('fs');
const path = require('path');

function getTokenFile() {
  return process.env.MELI_TOKEN_FILE || '';
}

function readTokens() {
  const file = getTokenFile();
  if (!file) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return {
      accessToken: String(parsed.accessToken || ''),
      refreshToken: String(parsed.refreshToken || ''),
      expiresAt: Number(parsed.expiresAt || 0),
    };
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Falha ao ler tokens persistidos:', error.message);
    return null;
  }
}

function writeTokens(tokens) {
  const file = getTokenFile();
  if (!file) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporaryFile = `${file}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(tokens), { mode: 0o600 });
  fs.renameSync(temporaryFile, file);
  return true;
}

module.exports = { readTokens, writeTokens };
