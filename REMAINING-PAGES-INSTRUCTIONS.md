# Remaining Pages Polish — PP Website V3

Polish the quickstart, pricing, and contact pages. These must match the quality of the homepage and artifact pages.

## Page 1: /developers/quickstart — Developer Quickstart

This is the "magic moment" page. A developer should go from zero to first receipt in 5 minutes by following this page.

### Layout
- Full-width page with void (#0a0a0a) background
- Content max-width ~720px centered
- Generous spacing between steps

### Header
- "Quickstart" label in small uppercase teal tracking-widest
- Headline: "Your first authority receipt in 5 minutes." (text-4xl font-bold)
- Subheadline: "Install the SDK, add an approval guard, and share your first receipt." (text-lg text-secondary)

### Step-by-step Guide
Each step should be a distinct card-like section (#1a1a1a background, border #222, rounded-lg, p-6):

**Step 1 — Install**
- Step number badge: teal circle with "1" in white
- Title: "Install the SDK"
- Code block: `pip install permission-protocol`
- With copy button
- Note below: "Also available: `npm install @permissionprotocol/sdk`"

**Step 2 — Configure**
- Step badge: "2"
- Title: "Configure your API key"
- Code block:
```python
import permission_protocol as pp
pp.configure(api_key="pp_key_...")
```
- Note: "Get your free API key at permissionprotocol.com/developers"

**Step 3 — Add an approval guard**
- Step badge: "3"
- Title: "Protect a risky action"
- Code block:
```python
from permission_protocol import require_approval

@require_approval
def deploy_service():
    deploy("billing-api")
```
- Note: "Any function decorated with @require_approval will pause until authorized."

**Step 4 — Run your agent**
- Step badge: "4"
- Title: "See it in action"
- Terminal-style code block (with macOS dots):
```
$ python agent.py
> deploy_service() requested
> Authorization required
> Approval link: https://permissionprotocol.com/approve/4ac91
> Waiting for approval...
>
> ✓ Approved by sarah.kim
> ✓ Receipt issued: pp_r_8f91c2
> ✓ Deployment executed
```
- Terminal should have green for ✓ lines, amber for "Waiting", teal for "Authorization required"

**Step 5 — Approve in the browser**
- Step badge: "5"
- Title: "Approve the action"
- Description: "Open the approval link. Review the action details. Click Approve."
- Visual: a mini mockup of the approval page (simplified — just show the card with action summary + approve/reject buttons, using the same design language as /approve/[id] but smaller)

**Step 6 — Share the receipt**
- Step badge: "6"
- Title: "Share your proof"
- Code showing the receipt URL: `https://permissionprotocol.com/r/8f91c2`
- Description: "Paste this link anywhere — Slack, GitHub PRs, Jira tickets, compliance docs. Anyone who clicks sees verified proof of authorization."
- Visual: mini mockup of receipt page

### Next Steps Section
- Subtle border-top separator
- "What's next?" heading
- Three link cards in a row:
  - "Verify receipts in CI/CD" → # (coming soon badge)
  - "Explore the SDK API" → # (coming soon badge)
  - "Join the community" → # (coming soon badge)

### CTA
- "Questions? Talk to us →" link to /contact

---

## Page 2: /pricing — Pricing

Clean, simple pricing page. Don't overthink it.

### Layout
- Void background, centered content
- Max-width ~900px

### Header
- "Pricing" label in small uppercase teal
- Headline: "Start free. Scale with authority." (text-4xl font-bold)
- Subheadline: "Every plan includes the core primitive: signed authority receipts." (text-lg text-secondary)

### Tier Grid
Three cards side by side (responsive: stack on mobile):

**Card 1 — Free**
- Background: #1a1a1a, border #222
- Title: "Free" in white
- Price: "$0" large, "/month" small
- Subtitle: "For individual developers"
- Features list (checkmarks in teal):
  - SDK access (Python + Node)
  - 1,000 receipts/month
  - Approval links
  - Receipt proof pages
  - Community support
- CTA button: "Get Started" (teal, outlined)

**Card 2 — Team** (HIGHLIGHTED — this is the conversion target)
- Background: #1a1a1a, border in TEAL (#44aa99) 
- "Most Popular" badge in teal at top
- Title: "Team" in white
- Price: "Coming Soon" (or "$49/month" if Rod wants a number)
- Subtitle: "For teams shipping with agents"
- Features list:
  - Everything in Free
  - Unlimited receipts
  - Team approval workflows
  - Shared policies
  - Audit log & export
  - Priority support
- CTA button: "Join Waitlist" (teal, filled)

**Card 3 — Enterprise**
- Background: #1a1a1a, border #222
- Title: "Enterprise" in white
- Price: "Custom"
- Subtitle: "For organizations at scale"
- Features list:
  - Everything in Team
  - Self-hosted authority nodes
  - Federation support
  - SSO / SAML
  - Compliance exports (SOC 2, ISO 27001)
  - Dedicated support & SLA
- CTA button: "Talk to Sales" (outlined)

### Bottom Section
- "Start with the primitive" callout:
- Text: "Every plan starts the same way: install the SDK, add @require_approval, get your first receipt. Enforcement grows from there."
- CTA: "Read the Quickstart →" link to /developers/quickstart

---

## Page 3: /contact — Contact / Early Access

### Layout
- Void background, centered content
- Max-width ~600px

### Header
- "Contact" label in small uppercase teal
- Headline: "Let's map your enforcement points." (text-4xl font-bold)
- Subheadline: "Tell us what your agents do. We'll show you where authority receipts fit." (text-lg text-secondary)

### Form
Clean form with proper styling:
- Each field: label in #888, input with #1a1a1a background, #222 border, #c8c8c8 text, teal focus ring
- Fields:
  - Name (text input)
  - Email (email input)
  - Company (text input)
  - Use Case (select dropdown): "CI/CD Deploys", "Database Operations", "Financial Transactions", "Data Access", "API Security", "Multi-Agent Orchestration", "Other"
  - Environment (select): "AWS", "GCP", "Azure", "Multi-cloud", "On-premise", "Other"
  - Message (textarea, placeholder: "Tell us about your agent infrastructure...")
- Submit button: "Send" in teal, full width
- On submit: show a success state ("Thanks! We'll be in touch within 24 hours.")
- Form is client-side demo only (no backend needed yet)

### What Happens Next
Below the form:
- Three step cards in a row (small):
  1. "We review" — "We'll review your enforcement points and agent architecture."
  2. "We map" — "We'll map where receipt verification adds the most value."
  3. "We pilot" — "We'll propose a pilot with measurable outcomes."

### Alternative CTA
- "Prefer to start on your own? Read the Quickstart →" link

---

## General Rules
- All pages: consistent with homepage visual language (void bg, teal accents, Space Grotesk, cards in #1a1a1a)
- All pages: responsive (mobile-first)
- All pages: scroll-triggered Framer Motion animations (fade up, fast 0.3s)
- All pages: OpenGraph meta tags
- Navigation should work: links to these pages from the nav should route correctly

## After making changes:
1. Run `npx next build` to verify no errors
2. Commit with message "Remaining pages: quickstart, pricing, contact"
3. Push to origin website-v3
