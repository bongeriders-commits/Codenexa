const { db } = require('../lib/firebaseAdmin');
const { sendJson } = require('../lib/apiHelpers');
const { isAuthenticated } = require('../lib/adminAuth');

const ALLOWED_COLLECTIONS = new Set([
  'contact_messages', 'quote_requests', 'callback_requests', 'newsletter_subscribers',
]);
const ALLOWED_STATUSES = new Set(['new', 'done']);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  if (!isAuthenticated(req)) {
    return sendJson(res, 401, { ok: false, error: 'Not authenticated' });
  }

  const { collection, id, status } = req.body || {};

  if (!ALLOWED_COLLECTIONS.has(collection)) {
    return sendJson(res, 400, { ok: false, error: 'Invalid collection.' });
  }
  if (!id || typeof id !== 'string') {
    return sendJson(res, 400, { ok: false, error: 'Missing document id.' });
  }
  if (!ALLOWED_STATUSES.has(status)) {
    return sendJson(res, 400, { ok: false, error: 'Invalid status.' });
  }

  try {
    await db.collection(collection).doc(id).update({ status });
    return sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error('admin-update.js error:', err);
    return sendJson(res, 500, { ok: false, error: 'Failed to update.' });
  }
};
