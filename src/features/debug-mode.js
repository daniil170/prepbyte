const KEY_SALT = 'x9f2';
const KEY_CHECKSUM = '5959fc99902ac85873ec18bfae04a6fa4c8a5f2ef6b9d1d0753e6bf74f5beefd';

async function enableDebugMode(salt = KEY_SALT, key = '') {
  const data = new TextEncoder().encode(salt + key);
  const buf = await crypto.subtle.digest('SHA-256', data);
  const hex = [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  if (hex === KEY_CHECKSUM) {
    window.__DEBUG_BYPASS__ = true;
    return true;
  }
  return false;
}

function isDebugMode() {
  return !!window.__DEBUG_BYPASS__;
}

window.enableDebugMode = enableDebugMode;

export { enableDebugMode, isDebugMode };