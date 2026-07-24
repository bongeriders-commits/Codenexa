const crypto = require('crypto');
const { sendJson } = require('../lib/apiHelpers');
const { buildSessionCookie } = require('../lib/adminAuth');

function safeEqual(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  const { password } = req.body || {};
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || !process.env.ADMIN_SESSION_SECRET) {
    return sendJson(res, 500, { ok: false, error: 'Admin login is not configured yet.' });
  }

  // TEMPORARY DEBUG — remove after troubleshooting
  console.log('DEBUG expected length:', expected.length, JSON.stringify(expected));
  console.log('DEBUG received length:', (password || '').length, JSON.stringify(password));

  if (!password || !safeEqual(password, expected)) {
    return sendJson(res, 401, { ok: false, error: 'Incorrect password.' });
  }

  res.setHeader('Set-Cookie', buildSessionCookie());
  return sendJson(res, 200, { ok: true });
};
