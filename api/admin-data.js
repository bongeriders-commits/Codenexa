const { db } = require('../lib/firebaseAdmin');
const { sendJson } = require('../lib/apiHelpers');
const { isAuthenticated } = require('../lib/adminAuth');

const COLLECTION_ORDER_FIELDS = {
  contact_messages: 'submittedAt',
  quote_requests: 'submittedAt',
  callback_requests: 'submittedAt',
  newsletter_subscribers: 'subscribedAt',
};
const COLLECTIONS = Object.keys(COLLECTION_ORDER_FIELDS);
const LIMIT_PER_COLLECTION = 200;

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  if (!isAuthenticated(req)) {
    return sendJson(res, 401, { ok: false, error: 'Not authenticated' });
  }

  try {
    const result = {};

    for (const name of COLLECTIONS) {
      const snap = await db.collection(name)
        .orderBy(COLLECTION_ORDER_FIELDS[name], 'desc')
        .limit(LIMIT_PER_COLLECTION)
        .get();

      result[name] = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }

    return sendJson(res, 200, { ok: true, data: result });
  } catch (err) {
    console.error('admin-data.js error:', err);
    return sendJson(res, 500, { ok: false, error: 'Failed to load data.' });
  }
};
