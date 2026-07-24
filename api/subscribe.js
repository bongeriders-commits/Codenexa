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

    const missing = requireFields(body, ['email']);
    if (missing.length) {
      return sendJson(res, 400, { ok: false, error: `Missing: ${missing.join(', ')}` });
    }
    if (!isValidEmail(body.email)) {
      return sendJson(res, 400, { ok: false, error: 'Invalid email address' });
    }

    const email = String(body.email).trim().toLowerCase();

    // Use the email itself as the doc ID so a repeat signup just updates
    // the timestamp instead of creating duplicate subscriber rows.
    await db.collection('newsletter_subscribers').doc(email).set({
      email,
      subscribedAt: new Date().toISOString(),
    }, { merge: true });

    return sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error('subscribe.js error:', err);
    return sendJson(res, 500, { ok: false, error: 'Something went wrong. Please try again.' });
  }
};
