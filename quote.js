const { db } = require('../lib/firebaseAdmin');
const { sendJson, isHoneypotTripped, requireFields, isValidEmail } = require('../lib/apiHelpers');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};

    if (isHoneypotTripped(body)) {
      return sendJson(res, 200, { ok: true });
    }

    const missing = requireFields(body, ['phone', 'email']);
    if (missing.length) {
      return sendJson(res, 400, { ok: false, error: `Missing: ${missing.join(', ')}` });
    }
    if (!isValidEmail(body.email)) {
      return sendJson(res, 400, { ok: false, error: 'Invalid email address' });
    }

    await db.collection('quote_requests').add({
      plan: body.plan ? String(body.plan).trim() : '',
      phone: String(body.phone).trim(),
      email: String(body.email).trim(),
      details: body.details ? String(body.details).trim() : '',
      status: 'new',
      submittedAt: new Date().toISOString(),
    });

    return sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error('quote.js error:', err);
    return sendJson(res, 500, { ok: false, error: 'Something went wrong. Please try again.' });
  }
};
