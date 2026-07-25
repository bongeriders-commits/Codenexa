const { db } = require('../lib/firebaseAdmin');
const { sendJson } = require('../lib/apiHelpers');
const { isAuthenticated } = require('../lib/adminAuth');
const { sendEmail } = require('../lib/sendEmail');

function money(n) {
  return `KSh ${Number(n).toLocaleString('en-KE')}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  if (!isAuthenticated(req)) {
    return sendJson(res, 401, { ok: false, error: 'Not authenticated' });
  }

  const { orderId } = req.body || {};
  if (!orderId || typeof orderId !== 'string') {
    return sendJson(res, 400, { ok: false, error: 'Missing order id.' });
  }

  try {
    const ref = db.collection('orders').doc(orderId);
    const doc = await ref.get();

    if (!doc.exists) {
      return sendJson(res, 404, { ok: false, error: 'Order not found.' });
    }

    const order = doc.data();

    const subject = `Order Confirmed — ${order.orderNumber}`;
    const text =
      `Hi ${order.fullName},\n\n` +
      `Thanks for your order with CodeNexa Solutions! Here are your order details:\n\n` +
      `Order Number: ${order.orderNumber}\n` +
      `Package: ${order.plan}\n` +
      `Amount Due: ${money(order.price)} (Pay on Delivery)\n` +
      `Delivery Location: ${order.town}, ${order.county} — ${order.address}\n\n` +
      `We'll be in touch shortly to confirm delivery details. If you have any ` +
      `questions, just reply to this email or call us at 0747 672 771.\n\n` +
      `— CodeNexa Solutions`;

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#1b2434;max-width:520px;margin:0 auto;">
        <h2 style="color:#0a1a3c;">Order Confirmed ✅</h2>
        <p>Hi ${order.fullName},</p>
        <p>Thanks for your order with <strong>CodeNexa Solutions</strong>! Here are your order details:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:6px 0;color:#5b6675;">Order Number</td><td style="padding:6px 0;font-weight:700;">${order.orderNumber}</td></tr>
          <tr><td style="padding:6px 0;color:#5b6675;">Package</td><td style="padding:6px 0;font-weight:700;">${order.plan}</td></tr>
          <tr><td style="padding:6px 0;color:#5b6675;">Amount Due</td><td style="padding:6px 0;font-weight:700;">${money(order.price)} (Pay on Delivery)</td></tr>
          <tr><td style="padding:6px 0;color:#5b6675;">Delivery Location</td><td style="padding:6px 0;">${order.town}, ${order.county} — ${order.address}</td></tr>
        </table>
        <p>We'll be in touch shortly to confirm delivery details. Questions? Reply to this email or call us at <strong>0747 672 771</strong>.</p>
        <p style="color:#5b6675;">— CodeNexa Solutions</p>
      </div>`;

    await sendEmail({ to: order.email, subject, text, html });

    await ref.update({ emailSent: true, emailSentAt: new Date().toISOString() });

    return sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error('send-order-email.js error:', err);
    return sendJson(res, 500, { ok: false, error: 'Failed to send email.' });
  }
};
