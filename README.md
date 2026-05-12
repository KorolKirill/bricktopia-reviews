# frontend-reviews-page

> Static review-collection landing page deployed to Vercel.

A lightweight HTML/CSS/JS form for gathering customer reviews — embeddable via the snippet in `EMBED.md`. No backend; submissions are forwarded to an external service (Formspree / Mailgun / similar).

- **Stack:** plain HTML/CSS/JS.
- **Deploy:** Vercel static (config in `vercel.json`).

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
