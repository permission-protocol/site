# Artifact Pages Polish — PP Website V3

These three pages are the viral distribution engine. They must be BEAUTIFUL — Stripe-payment-confirmation level polish. Every receipt link shared is an ad for PP.

## Page 1: /r/[id] — Receipt Proof Page (MOST IMPORTANT)

This is the page people see when a developer shares a receipt link. It must feel like a real institutional document — trustworthy, clean, authoritative.

### Layout
- Centered single card on void (#0a0a0a) background
- Card max-width ~520px, generous padding (p-8 md:p-10)
- Card background: #1a1a1a with subtle border (#222)
- Card should have depth: box-shadow 0 20px 60px rgba(0,0,0,0.5)

### Section 1: Status Badge (top of card)
- Large green (#10B981) pill/badge: "✓ ACTION AUTHORIZED"
- Or red (#EF4444) pill: "✕ INVALID" or "✕ EXPIRED" for failed states
- The badge should be prominent — 16px font, bold, rounded-full, px-4 py-2

### Section 2: Action Summary
- Large text showing the action: "Deploy → billing-service" (text-2xl font-bold)
- Visual separator line below

### Section 3: Receipt Details
- Clean label/value pairs with generous spacing:
  - Agent: deploy-bot
  - Approved by: Sarah Kim
  - Policy: production-deploy
  - Timestamp: 2026-03-03 10:14:22 UTC
- Labels in #666 (muted), values in #c8c8c8 (primary)
- Each pair on its own line with py-2

### Section 4: Signature Verification
- A distinct section with a subtle top border
- "Signature: Verified ✓" in green, with a small shield/lock icon
- "Issuer: Permission Protocol" in teal (#44aa99)
- This should feel institutional — like a notary stamp

### Section 5: Verification Details (expandable)
- A collapsible section (click to expand)
- Label: "Technical Details ▾"
- When expanded shows:
  - Signature Algorithm: Ed25519
  - Key ID: pp_key_2026_03
  - Authority Chain: [Permission Protocol Root]
  - Raw JSON (syntax highlighted — keys in teal, values in green, punctuation in #666)

### Section 6: Share Controls
- Row of action buttons below the card:
  - "Copy Link" — copies the current URL, shows "Copied!" feedback for 2s
  - "Copy JSON" — copies receipt JSON, shows "Copied!" feedback
  - "Download" — downloads receipt as .json file
- Buttons: outlined style, #222 border, teal on hover

### Footer
- Below the card, centered:
- Small PP logo or wordmark
- "Powered by Permission Protocol"
- "Get Started Free →" link in teal
- This footer is subtle — it's an ad but shouldn't feel like one

### Demo Data
Use this hardcoded receipt for the demo:
```
receipt_id: "8f91c2"
action: "deploy"
resource: "billing-service"
actor: "deploy-bot"
approved_by: "Sarah Kim"
policy: "production-deploy"
timestamp: "2026-03-03T10:14:22Z"
authority_issuer: "permissionprotocol.com"
signature: "pp_sig_a8f2e91c..."
```

---

## Page 2: /replay/[id] — Action Replay Page

This is the "PP saved my database" page. It tells a story through a timeline.

### Layout
- Centered content, max-width ~600px
- Void background (#0a0a0a)

### Header
- "AI Action Replay" in text-3xl font-bold
- Below: outcome badge — green "AUTHORIZED" or red "BLOCKED"

### Timeline
Build a proper vertical timeline component:
- Vertical line on the left (2px, #222)
- Each event has:
  - Timestamp in monospace (#666) on the left
  - Colored dot on the timeline line (12px circle)
  - Event description on the right
  - Sub-details in smaller muted text below

### AUTHORIZED replay demo data:
```
10:14:12 — [teal dot] Agent proposes action
              deploy billing-service
              Agent: deploy-bot

10:14:13 — [teal dot] Permission Protocol evaluates
              Policy: production-deploy
              Risk tier: standard

10:14:14 — [amber dot] Human approval required
              Approval link sent to sarah.kim
              Waiting for authorization...

10:14:42 — [green dot] Approved by Sarah Kim
              Via: approval link
              Comment: "Approved for Q1 release"

10:14:43 — [green dot] Authority receipt issued
              Receipt: pp_r_8f91c2
              View receipt →

10:14:44 — [green dot, larger] Deployment executed ✓
              billing-service deployed to production
```

The final event should have a green glow effect.

### BLOCKED replay demo:
For the blocked version (show this if id contains "blocked"):
```
10:14:12 — [teal dot] Agent proposes action
              delete_database()
              Agent: cleanup-bot

10:14:13 — [red dot] Permission Protocol blocks action
              No authority receipt present
              Policy violation: destructive-ops-require-approval

10:14:13 — [RED X, large] ACTION BLOCKED
              No receipt. No execution.
```

The blocked state should feel VISCERAL:
- The red X should be large (40px) with a red glow (box-shadow: 0 0 30px rgba(239,68,68,0.4))
- The timeline line should visually stop/break at the block point
- "ACTION BLOCKED" in text-2xl font-bold text-[#EF4444]
- A red pulse animation on the X (subtle, 2s)

### Artifacts Section
Below the timeline:
- Links to related artifacts: "View Receipt →", "View Approval →"
- These link to /r/[id] pages

### Footer
Same as receipt page: "Protected by Permission Protocol" + "Get Started Free →"

---

## Page 3: /approve/[id] — Approval Page

This is where humans approve or reject agent actions.

### Layout
- Centered card, max-width ~480px
- Card background: #1a1a1a, border #222, generous shadow

### Section 1: Header
- Amber (#F59E0B) badge: "⚡ APPROVAL REQUIRED"
- This should feel urgent but not alarming

### Section 2: Action Summary
- What: "deploy" (large, bold)
- Resource: "billing-service"
- Agent: "deploy-bot"
- Risk Level: "Standard" (or "High" in red for dangerous actions)
- Requested: timestamp

### Section 3: Context
- Any additional context the agent provided
- Show in a subtle box (#111 background)

### Section 4: Decision Buttons
- Two large buttons, side by side:
  - "Approve" — green (#10B981) background, white text, full width on mobile
  - "Reject" — red (#EF4444) outlined, white text
- Optional comment field above the buttons (textarea, placeholder: "Add a note (optional)")
- Buttons should have hover states and feel decisive

### Section 5: Result State
After clicking approve:
- Card transitions to show: "✓ Approved" in green
- "Receipt issued: pp_r_8f91c2"
- "View Receipt →" link
After clicking reject:
- Card transitions to show: "✕ Rejected" in red
- "Action blocked. No receipt issued."

### Footer
"Powered by Permission Protocol"

### Demo behavior
- The approve/reject buttons should work as a demo — clicking them transitions the card to the result state (client-side only, no backend needed)

---

## General Rules for All Artifact Pages
- These pages must render beautifully as standalone URLs — they're often the FIRST thing someone sees of PP
- They must work on mobile (responsive)
- OpenGraph meta tags: title, description, image (use a generic PP OG image for now)
- The PP branding should be present but subtle — the receipt/replay is the star, not the chrome
- Use Framer Motion for entrance animations but keep them fast (0.3s) — people landing on these pages want to see content immediately

## After making changes:
1. Run `npx next build` to verify no errors
2. Commit with message "Artifact pages: receipt proof, replay timeline, approval workflow"
3. Push to origin website-v3
