# frontend-reviews-page

> Static review-collection landing page deployed to Vercel.

A lightweight HTML/CSS/JS form for gathering customer reviews — embeddable via the snippet in `EMBED.md`. No backend; submissions are forwarded to an external service (Formspree / Mailgun / similar).

- **Stack:** plain HTML/CSS/JS.
- **Deploy:** Vercel static (config in `vercel.json`).

## Rating flow (UA + PL, one deployment: `?store=ua|pl`)

- 4–5★ → «positive» step → public review form (`POST lost-orders /api/public/reviews/submit`, auto-approved).
- 1–3★ (`LOW_RATING_MAX` in `script.js`) → «negative» step: first the private complaint form ("let us fix it", `POST platizhka-back /reviews/submit`, `type: complaint`), and below it the button «Залишити публічний відгук» that opens the same review form with the low rating carried over (name / contact / text are copied from the complaint fields).
- A 1–3★ public review is saved as `status = pending` by the backend: it appears on the storefront only after approval in the lost-orders admin.
- No promo code for 1–3★ (owner, 13.10.2026): the backend doesn't create one, the form hides the promo card / «upgrade to 10%» offer and asks for a contact "so we can fix it" instead of "where to send the promo".

## Languages

Form copy exists in `uk`, `pl`, `en` (Kloniko: all three; Bricktopia: `uk`, `en`). `?locale=` with any other language (ru, it, de…) → English. No `?locale=` at all → the store's language (pl / uk).

## Run

```bash
npx serve public         # local preview
vercel deploy            # deploy
```

## API

No HTTP API.

## Key files

- `public/index.html` — landing/form.
- `public/style.css`
- `EMBED.md` — embed snippet for the storefront.
- `vercel.json` — Vercel config.

## Integrations

Vercel hosting · external form handler (configured in the form's `action` attribute).
