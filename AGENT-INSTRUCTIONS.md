# Build Instructions — PP Website V3

Read WEBSITE-SPEC.md for the full spec. This is the implementation guide.

## Project Setup

1. Remove all existing HTML/CSS/JS files (index.html, styles.css, main.js, etc.) EXCEPT the `admin/` folder, `vercel.json`, `favicon.ico`, `favicon.svg`, `sitemap.xml`, and `.git*` files.
2. Initialize Next.js 14+ with App Router, TypeScript, Tailwind CSS.
3. Set up design tokens in tailwind.config matching the hybrid color palette:
   - Background: #0a0a0a (void)
   - Surface: #1a1a1a (ash)
   - Borders: #222222
   - Text primary: #c8c8c8 (signal)
   - Text secondary: #888888
   - Primary accent: #44aa99 (permit teal)
   - Danger: #EF4444 (alert red)
   - Warning: #F59E0B (approval amber)
   - CTA: #44aa99
4. Set up fonts: Space Grotesk (headlines + body), JetBrains Mono (code). Use next/font.
5. Install framer-motion for animations.

## Component Library (build first)

Create these in `src/components/`:
- `Hero.tsx` — full-width hero with headline, subhead, CTAs, visual slot
- `SectionBlock.tsx` — standard section wrapper with headline, body, visual
- `CodeBlock.tsx` — syntax-highlighted, copyable, with language tabs (Python/Node/Terminal)
- `CTABanner.tsx` — full-width CTA with dev/enterprise split
- `ReceiptCard.tsx` — interactive receipt card with front (human-readable) / back (JSON) flip on hover
- `ComparisonTable.tsx` — animated row-by-row infrastructure comparison table
- `DiagramFlow.tsx` — animated vertical flow diagram (Agent → PP → Execution)
- `StackDiagram.tsx` — AI Economy Stack (4 layers, Authority highlighted)
- `UseCaseGrid.tsx` — 6-card grid with icons

## Homepage — Build ALL 10 sections

Build the homepage at `app/page.tsx` with all 10 sections from the spec:

### Section 1: HERO
- Headline: "AI agents shouldn't authorize their own actions."
- Subheadline: "Permission Protocol is the Signer of Record for AI systems — issuing cryptographic receipts that prove an action was authorized before it happens."
- Primary CTA: "Get Started — Free" → /developers/quickstart
- Secondary CTA: "See How It Works" → smooth scroll to Section 4
- Visual: Animated vertical flow diagram (Agent → PP → Authorized Action). PP node pulses with teal glow.

### Section 2: THE PROBLEM
- Headline: "Today, AI agents authorize themselves."
- Subheadline: "When AI systems deploy code, access data, or move money — nothing proves who approved it."
- Visual: Split screen. Left: Agent → Tool → Execution (red warnings: no approval, no proof, no accountability). Right: Agent → PP → Receipt → Execution (green checks: approved, verified, auditable).

### Section 3: THE SIGNER OF RECORD
- Headline: "The authority layer for AI systems."
- Subheadline: "Permission Protocol sits between AI decisions and real-world execution — issuing cryptographic proof that authority existed before the action occurred."
- Visual: AI Economy Stack diagram. Four layers. Authority Layer (PP) block has teal background + subtle glow.

### Section 4: HOW IT WORKS
- Headline: "Three steps. One receipt. Full accountability."
- Horizontal 3-step flow: (1) Agent Proposes → (2) PP Authorizes → (3) Infra Verifies
- Code block below showing pp.authorize() example
- CTA: "Try the SDK →"

### Section 5: THE AUTHORITY RECEIPT
- Headline: "The primitive that proves authority existed."
- Interactive ReceiptCard component (front/back flip)
- Front shows: Action, Resource, Agent, Approved by, Policy, Timestamp, Signature Verified, Issuer
- Back shows JSON with syntax highlighting
- CTA: "See a live receipt →"

### Section 6: INFRASTRUCTURE COMPARISON
- Headline: "Every critical system has an authority layer. AI doesn't — until now."
- Animated table: Identity/OAuth, Encryption/TLS, Payments/Stripe, Observability/Datadog, then Authority/Permission Protocol slides in last with teal highlight.

### Section 7: DEVELOPER EXPERIENCE
- Headline: "One line of code. Full authority."
- Tabbed code blocks: Python (@require_approval), Node.js (authorize()), Terminal output
- CTA: copyable "pip install permission-protocol"

### Section 8: USE CASES
- Headline: "Authority for every consequential AI action."
- 6-card grid: CI/CD Deploys, Database Operations, Financial Transactions, Data Access, API Calls, Multi-Agent Orchestration

### Section 9: SOCIAL PROOF
- Headline: "Trusted by teams building the future of autonomous systems."
- Placeholder logo bar + metric cards

### Section 10: FINAL CTA
- Headline: "Authority before execution. Start now."
- Two CTA cards: For Developers / For Enterprise

## Design Quality

This must feel like Stripe or Vercel's marketing site, not generic AI slop. Key details:
- Scroll-triggered section reveals (fade up, staggered)
- The hero flow diagram should animate on load
- The receipt card flip should feel satisfying (0.3s ease, proper 3D perspective)
- The comparison table rows should build sequentially with the PP row appearing last and glowing
- Dark background (#0a0a0a) throughout. Cards use #1a1a1a or #111111.
- Generous whitespace between sections
- The teal (#44aa99) is the ONLY accent color for positive/CTA states
- Use Lucide icons

## Navigation

Simple fixed header:
- Left: "Permission Protocol" wordmark
- Right: "How It Works" (scroll), "Developers" (/developers/quickstart), "Pricing" (/pricing), "Get Started" (teal button → /developers/quickstart)

Simple footer:
- Links to pages that exist
- "Powered by Permission Protocol" tagline
- © 2026

## After building, commit all changes with a descriptive message.

When completely finished, run this command to notify me:
openclaw system event --text "Done: PP Website V3 homepage — all 10 sections built with Next.js + Tailwind + Framer Motion" --mode now
