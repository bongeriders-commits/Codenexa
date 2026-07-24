const crypto = require('crypto');

const COOKIE_NAME = 'admin_session';
const SESSION_HOURS = 12;

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  });
  return out;
}

// Builds a Set-Cookie header value for a fresh, signed session valid for SESSION_HOURS.
function buildSessionCookie() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const exp = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = String(exp);
  const signature = sign(payload, secret);
  const value = `${payload}.${signature}`;
  const isProd = process.env.VERCEL_ENV !== 'development';
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; HttpOnly; Path=/; Max-Age=${SESSION_HOURS * 3600}; SameSite=Lax${isProd ? '; Secure' : ''}`;
}

function buildClearCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}

// Returns true if the request carries a valid, unexpired signed session cookie.
function isAuthenticated(req) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;

  const cookies = parseCookies(req);
  const raw = cookies[COOKIE_NAME];
  if (!raw) return false;

  const [payload, signature] = raw.split('.');
  if (!payload || !signature) return false;

  const expected = sign(payload, secret);
  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return false;
  }

  const exp = Number(payload);
  return Number.isFinite(exp) && Date.now() < exp;
}

module.exports = { buildSessionCookie, buildClearCookie, isAuthenticated };
