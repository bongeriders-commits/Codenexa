# CodeNexa App (standalone)

This is an **independent** copy of the CodeNexa Solutions site, turned into an
installable app (PWA). It is a separate codebase from the `codenexa-website`
project — editing/deploying one never affects the other.

## What was added on top of the website copy
- `manifest.json` — app name, white theme/background color, standalone display mode, icons.
- `icons/` — app icons generated from `images/logo.png` on a white square canvas (16/32/180/192/512).
- `sw.js` — service worker that caches the app shell for offline/instant loading, with its own cache name (`codenexa-app-v1`), separate from the website's cache.
- Every `.html` page: white splash screen (was navy) showing the logo full-size while the page loads, plus `<link rel="manifest">`, icon tags, `theme-color`, and service worker registration.

## Deploying independently
1. Push this folder to its **own** GitHub repo (not the website's repo).
2. Create a **separate** Vercel project pointing at that repo (e.g. `app.codenexa...` or its own domain).
3. Set the same environment variables as the website project if you want `/api` (contact, quote, admin) to keep working here too — they're independent instances of the same functions, not shared with the website.

## Installing on a phone
- Android/Chrome: visit the deployed URL → "Add to Home screen" → opens full-screen with the white splash + logo, no browser UI.
- iOS/Safari: Share → "Add to Home Screen".
