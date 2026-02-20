# Permission Protocol Marketing Website

Infrastructure-grade marketing site for Permission Protocol.

## Stack

- Static HTML/CSS/JS
- Vercel hosting + serverless functions
- PostHog analytics
- Airtable form storage

## Pages

- `/` — Homepage
- `/deploy-gate` — Deploy Gate integration guide
- `/architecture` — System architecture
- `/receipt-model` — Technical receipt specification
- `/request-access` — Access request form

## Development

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally
vercel dev
```

## Environment Variables

Set in Vercel dashboard:

### Required for Form Submissions

```
AIRTABLE_API_KEY=pat_xxx        # Airtable Personal Access Token
AIRTABLE_BASE_ID=appXXX         # Airtable Base ID
AIRTABLE_TABLE_NAME=Requests    # Table name (default: Requests)
```

### Required for Notifications

```
POSTMARK_API_KEY=xxx            # Postmark server token
NOTIFICATION_EMAIL=xxx          # Email to receive notifications
NOTIFICATION_FROM=xxx           # From address for notifications
```

### Required for Analytics

```
POSTHOG_API_KEY=phc_xxx         # PostHog project API key
```

## Airtable Schema

Create a table called "Requests" with these fields:

| Field | Type |
|-------|------|
| Company | Single line text |
| GitHub Org | Single line text |
| Engineers | Single select (1-5, 6-20, 21-50, 51-200, 200+) |
| AI Deploy | Checkbox |
| Action | Long text |
| Email | Email |
| Source | Single line text |
| Submitted At | Date |
| Status | Single select (New, Contacted, Qualified, Onboarding, Passed) |

## PostHog Events

### Client-side (main.js)

- `page_view` — Page load
- `section_viewed` — Scroll into section
- `demo_interaction` — Demo button click
- `cta_click` — CTA button click
- `form_started` — First form field focus
- `form_submitted` — Form success
- `page_exit` — Leave page (with time on page)

### Server-side (api/request-access.js)

- `request_access_submitted` — Form submission confirmed

## Deployment

Push to `main` branch. Vercel auto-deploys.

```bash
git add -A
git commit -m "Update site"
git push origin main
```

## Design Reference

- Tone: Calm, declarative, infrastructure-grade
- Visual: Minimal black/white, clean typography
- Reference: Early Stripe + Cloudflare seriousness
