const { db } = require('../lib/firebaseAdmin');
const { sendJson, isHoneypotTripped, requireFields, isValidEmail } = require('../lib/apiHelpers');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};

    if (isHoneypotTripped(body)) {
      // Pretend success to the bot so it doesn't retry; do nothing.
      return sendJson(res, 200, { ok: true });
    }

    const missing = requireFields(body, ['name', 'phone', 'email']);
    if (missing.length) {
      return sendJson(res, 400, { ok: false, error: `Missing: ${missing.join(', ')}` });
    }
    if (!isValidEmail(body.email)) {
      return sendJson(res, 400, { ok: false, error: 'Invalid email address' });
    }

    await db.collection('contact_messages').add({
      name: String(body.name).trim(),
      phone: String(body.phone).trim(),
      email: String(body.email).trim(),
      subject: body.subject ? String(body.subject).trim() : '',
      message: body.message ? String(body.message).trim() : '',
      status: 'new',
      submittedAt: new Date().toISOString(),
    });

    return sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error('contact.js error:', err);
    return sendJson(res, 500, { ok: false, error: 'Something went wrong. Please try again.' });
  }
};
