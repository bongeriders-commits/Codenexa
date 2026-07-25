const { db } = require('../lib/firebaseAdmin');
const {
  sendJson,
  isHoneypotTripped,
  requireFields,
  isValidEmail,
  generateOrderNumber,
} = require('../lib/apiHelpers');
const { sendSms } = require('../lib/sendSms');

// Prices are decided here on the server — never trust a price sent by the
// browser, since anyone could edit it before submitting.
const PACKAGE_PRICES = {
  Basic: 20000,
  Standard: 60000,
  Premium: 100000,
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};

    if (isHoneypotTripped(body)) {
      return sendJson(res, 200, { ok: true });
    }

    const missing = requireFields(body, [
      'plan', 'fullName', 'phone', 'email', 'county', 'town', 'address',
    ]);
    if (missing.length) {
      return sendJson(res, 400, { ok: false, error: `Missing: ${missing.join(', ')}` });
    }

    const plan = String(body.plan).trim();
    if (!PACKAGE_PRICES[plan]) {
      return sendJson(res, 400, { ok: false, error: 'Invalid package selected.' });
    }

    if (!isValidEmail(body.email)) {
      return sendJson(res, 400, { ok: false, error: 'Invalid email address' });
    }

    const price = PACKAGE_PRICES[plan];

    // Generate an order number and make sure it isn't already taken
    // (astronomically unlikely, but cheap to check).
    let orderNumber;
    let attempts = 0;
    let existingDoc;
    do {
      orderNumber = generateOrderNumber();
      existingDoc = await db.collection('orders').doc(orderNumber).get();
      attempts++;
    } while (existingDoc.exists && attempts < 5);

    const orderData = {
      orderNumber,
      plan,
      price,
      fullName: String(body.fullName).trim(),
      phone: String(body.phone).trim(),
      email: String(body.email).trim(),
      county: String(body.county).trim(),
      town: String(body.town).trim(),
      address: String(body.address).trim(),
      notes: body.notes ? String(body.notes).trim() : '',
      paymentMethod: 'Pay on Delivery',
      status: 'new',
      emailSent: false,
      submittedAt: new Date().toISOString(),
    };

    await db.collection('orders').doc(orderNumber).set(orderData);

    // Text the admin about the new order. This never blocks or fails the
    // order itself — if SMS isn't configured yet, or Twilio errors out,
    // we just log it and move on.
    if (process.env.ADMIN_PHONE_NUMBER) {
      sendSms({
        to: process.env.ADMIN_PHONE_NUMBER,
        body: `New order ${orderNumber} (${plan}, KSh ${price.toLocaleString('en-KE')}) from ${orderData.fullName} — ${orderData.phone}.`,
      }).catch((err) => console.error('Order SMS notify failed:', err.message));
    }

    return sendJson(res, 200, { ok: true, orderNumber, plan, price });
  } catch (err) {
    console.error('order.js error:', err);
    return sendJson(res, 500, { ok: false, error: 'Something went wrong. Please try again.' });
  }
};
