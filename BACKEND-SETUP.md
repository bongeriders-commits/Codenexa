# CodeNexa Website Backend — Setup Guide

Four form endpoints now save to Firestore instead of using mailto/WhatsApp
handoffs:

| Form                        | Endpoint         | Firestore collection     |
|------------------------------|------------------|---------------------------|
| Contact page                 | `/api/contact`   | `contact_messages`        |
| Pricing → Get a Quote         | `/api/quote`     | `quote_requests`          |
| Pricing → Request a Call Back | `/api/callback`  | `callback_requests`       |
| Blog → Subscribe              | `/api/subscribe` | `newsletter_subscribers`  |

## 1. Create (or reuse) a Firebase project

1. Go to https://console.firebase.google.com and create a project (or use
   an existing one — a fresh project dedicated to the website is cleanest).
2. In the project, open **Build → Firestore Database → Create database**.
   Start in production mode; the API functions use the Admin SDK, which
   bypasses Firestore security rules, so client-side rules can stay locked
   down (deny all).

## 2. Generate a service account key

1. Firebase Console → ⚙️ **Project Settings → Service Accounts**.
2. Click **Generate new private key** — downloads a JSON file. Keep it
   private; never commit it to the repo.
3. From that JSON you need three values: `project_id`, `client_email`,
   and `private_key`.

## 3. Add environment variables in Vercel

In your Vercel project → **Settings → Environment Variables**, add:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` — paste the private key exactly as in the JSON
  file, including the `-----BEGIN PRIVATE KEY-----` / `-----END...-----`
  lines. Vercel's UI handles the newlines fine when pasted directly.

(See `.env.example` in this project for the shape.)

Redeploy after adding the variables so the functions pick them up.

## 4. Deploy

Push this project (including the `api/`, `lib/` folders and
`package.json`) to the GitHub repo connected to your Vercel project — no
extra config needed. Vercel auto-detects the `api/` folder as serverless
functions and installs `firebase-admin` from `package.json` during build.

## 5. Verify

After deploying, submit each form once and check Firestore Console → your
new collections should show the test documents. Each collection stores a
`status: "new"` field so you can build a simple leads dashboard later
(e.g. mark handled requests as `status: "done"`).

## Notes

- All four endpoints include a hidden honeypot field (`website`) for basic
  spam filtering — real visitors never fill it in, so any submission with
  it filled is silently dropped.
- The newsletter endpoint uses the subscriber's email as the Firestore
  document ID, so re-subscribing just updates the timestamp instead of
  creating duplicates.
- If you ever want email notifications on top of the Firestore records
  (e.g. "ping me the moment someone submits"), a lightweight next step is
  a Firebase Cloud Function trigger on new documents that sends via
  Resend/SendGrid — happy to add that later.

## Admin dashboard

`/admin.html` lists every submission from all 4 collections in one place,
with a "mark as done" button so you can track what's been handled. It is
**not linked from any public page** — you (or anyone) can only reach it by
typing the URL directly, and it's also blocked from search engines via
`robots.txt`.

Setup:
1. Add two more environment variables in Vercel:
   - `ADMIN_PASSWORD` — the password you'll type in to log in
   - `ADMIN_SESSION_SECRET` — any long random string (32+ characters);
     used to cryptographically sign your login session, not something you
     type in yourself
2. Redeploy.
3. Visit `codenex-lemon.vercel.app/admin.html`, enter the password.

How it works: logging in sets a signed, `HttpOnly` cookie (can't be read
or stolen by page scripts) valid for 12 hours. The data and update
endpoints (`/api/admin-data`, `/api/admin-update`) check that cookie
before returning anything — without it, they just return "not
authenticated," so there's no way to read leads without the password.

This is a single shared password, not individual accounts — fine for one
or two people managing it. If you ever need per-person logins or an audit
trail of who marked what, that's a further upgrade (e.g. Firebase Auth)
rather than a change to this setup.

