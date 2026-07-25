// Very small helper set shared by every /api function.
const crypto = require('crypto');

function sendJson(res, status, body) {
  res.status(status).json(body);
}

// Basic honeypot + rate-limit-free spam guard: reject if a hidden field
// (named "website") was filled in. Real users never see or fill this field;
// bots that auto-fill every input on a form will.
function isHoneypotTripped(body) {
  return typeof body.website === 'string' && body.website.trim() !== '';
}

function requireFields(body, fields) {
  const missing = fields.filter((f) => !body[f] || String(body[f]).trim() === '');
  return missing;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

// Short, readable order number, e.g. "CNX-7F3K9Q".
// Excludes visually-confusing characters (0/O, 1/I/L).
function generateOrderNumber() {
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `CNX-${code}`;
}

module.exports = { sendJson, isHoneypotTripped, requireFields, isValidEmail, generateOrderNumber };
