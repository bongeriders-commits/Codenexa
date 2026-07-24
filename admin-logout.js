const { sendJson } = require('../lib/apiHelpers');
const { buildClearCookie } = require('../lib/adminAuth');

module.exports = async function handler(req, res) {
  res.setHeader('Set-Cookie', buildClearCookie());
  return sendJson(res, 200, { ok: true });
};
