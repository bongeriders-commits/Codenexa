// Minimal SMS sender using Twilio's REST API directly (no SDK dependency —
// Vercel's Node runtime has global fetch built in).
//
// Requires these env vars:
//   TWILIO_ACCOUNT_SID   — starts with "AC..."
//   TWILIO_AUTH_TOKEN    — from the Twilio console dashboard
//   TWILIO_PHONE_NUMBER  — the Twilio number to send FROM, in E.164 format (e.g. +15551234567)
//
// NOTE: on a Twilio trial account, the "To" number must be a verified
// number (Twilio console → Phone Numbers → Verified Caller IDs), or the
// send will fail. This is a Twilio account limit, not a bug here.

async function sendSms({ to, body }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !authToken || !fromNumber) {
    throw new Error('SMS is not configured (missing TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER).');
  }

  const credentials = Buffer.from(`${sid}:${authToken}`).toString('base64');

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: fromNumber, Body: body }).toString(),
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    throw new Error(`Twilio error ${res.status}: ${bodyText}`);
  }
}

module.exports = { sendSms };
