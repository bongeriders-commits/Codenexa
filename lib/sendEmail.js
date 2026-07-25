// Minimal transactional email sender using Brevo's HTTP API (no SDK
// dependency needed — Vercel's Node runtime has global fetch built in).
//
// Requires two env vars:
//   BREVO_API_KEY     — from Brevo dashboard → Settings → SMTP & API → API Keys
//   ADMIN_FROM_EMAIL  — the sender email you verified in Brevo
//
// Brevo's free plan lets you send from one verified address (e.g. your own
// Gmail) to ANY recipient — no domain purchase or DNS setup required.

async function sendEmail({ to, subject, text, html }) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.ADMIN_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    throw new Error('Email is not configured (missing BREVO_API_KEY or ADMIN_FROM_EMAIL).');
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: 'CodeNexa Solutions' },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    throw new Error(`Brevo error ${res.status}: ${bodyText}`);
  }
}

module.exports = { sendEmail };
