const { db } = require('../lib/firebaseAdmin');
const { sendJson, isHoneypotTripped, requireFields } = require('../lib/apiHelpers');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};

    if (isHoneypotTripped(body)) {
      return sendJson(res, 200, { ok: true });
    }

    const missing = requireFields(body, ['phone']);
    if (missing.length) {
      return sendJson(res, 400, { ok: false, error: `Missing: ${missing.join(', ')}` });
    }

    await db.collection('callback_requests').add({
      phone: String(body.phone).trim(),
      status: 'new',
      submittedAt: new Date().toISOString(),
    });

    return sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error('callback.js error:', err);
    return sendJson(res, 500, { ok: false, error: 'Something went wrong. Please try again.' });
  }
};
