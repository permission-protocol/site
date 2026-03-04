# Branding Pass — Bring Back the Bold Identity

The new site has the right content and structure, but it lost the current site's distinctive visual identity and voice. This pass fixes that.

## What to Change

### 1. Hero — Make it MASSIVE

The current site's hero says "The gate is always closed." in ENORMOUS type that fills the viewport. Our new hero needs that same energy.

**File: `src/components/Hero.tsx`**

Replace the current two-column hero layout with a centered, full-viewport hero:

```
- Remove the grid/two-column layout
- Center everything
- Make the headline HUGE: text-6xl on mobile, text-7xl md, text-8xl lg (minimum)
- Below the headline, show the PP gate SVG icon (120px, the grid/cross icon from the current site)
- Subheadline below the icon: "Permission Protocol is the Signer of Record for AI systems."
- Keep the CTA buttons but center them
- The hero should fill the full viewport height (min-h-screen)
- Remove the DiagramFlow component from the hero — it's generic and dilutes the brand
```

The PP gate SVG (from the current site — this IS the brand):
```html
<svg width="120" height="120" viewBox="0 0 16 16" fill="none" style="shape-rendering: geometricPrecision;">
  <rect x="1.5" y="1.5" width="13" height="13" stroke="#c8c8c8" stroke-width="1.2" fill="none"/>
  <line x1="1.5" y1="8" x2="14.5" y2="8" stroke="#c8c8c8" stroke-width="1.2"/>
  <line x1="8" y1="1.5" x2="8" y2="5.5" stroke="#c8c8c8" stroke-width="1.2"/>
  <line x1="8" y1="10.5" x2="8" y2="14.5" stroke="#c8c8c8" stroke-width="1.2"/>
</svg>
```

### 2. Nav — Add the PP Logo/Wordmark

**File: `src/components/SiteHeader.tsx`**

The current site has a distinctive logo lockup: the gate SVG + "PERMISSION/PROTOCOL" in uppercase with a slash. Bring this into the new nav.

Replace the current plain text "Permission Protocol" link with:
```tsx
<Link href="/" className="flex items-center gap-2">
  <svg className="h-5 w-5 text-signal" width="20" height="20" viewBox="0 0 16 16" fill="none" style={{ shapeRendering: 'crispEdges' }}>
    <rect x="1.5" y="1.5" width="13" height="13" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <line x1="1.5" y1="8" x2="14.5" y2="8" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="8" y1="1.5" x2="8" y2="5.5" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="8" y1="10.5" x2="8" y2="14.5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
  <span className="text-sm font-medium tracking-[0.08em]">
    <span className="text-signal">PERMISSION</span>
    <span className="text-permit">/</span>
    <span className="text-signal">PROTOCOL</span>
  </span>
</Link>
```

### 3. Headline Sizes — Go Bigger Everywhere

**File: `src/components/SectionBlock.tsx`**

Change headline sizing from `text-4xl md:text-5xl` to `text-5xl md:text-6xl`. Every section headline should command the viewport.

### 4. Section Spacing — More Room to Breathe

**File: `src/components/SectionBlock.tsx`**

Change `py-28 md:py-32` to `py-32 md:py-40`. Give each section more vertical space.

### 5. Before/After Section — Use the Iconic Gate Icons

**File: `app/page.tsx`**

The current site has a "Before / After" section with distinctive SVG icons:
- "Without PP": An X in a circle (denial)
- "With PP": The gate icon in teal with a checkmark

Replace the current red/green card comparison with a more visual approach using these iconic SVG illustrations:

**Without Permission Protocol card:**
```tsx
<svg width="80" height="80" viewBox="0 0 80 80" fill="none">
  <circle cx="40" cy="40" r="30" stroke="#aa4455" strokeWidth="2" fill="none" />
  <line x1="28" y1="28" x2="52" y2="52" stroke="#aa4455" strokeWidth="2" />
  <line x1="52" y1="28" x2="28" y2="52" stroke="#aa4455" strokeWidth="2" />
</svg>
```
Text below: "No enforced gate" / "Agents deploy unchecked" / "Trust is implicit"

**With Permission Protocol card:**
```tsx
<svg width="80" height="80" viewBox="0 0 80 80" fill="none">
  <rect x="20" y="20" width="40" height="40" stroke="#44aa99" strokeWidth="2" fill="none" />
  <line x1="20" y1="40" x2="60" y2="40" stroke="#44aa99" strokeWidth="2" />
  <line x1="40" y1="20" x2="40" y2="34" stroke="#44aa99" strokeWidth="2" />
  <line x1="40" y1="46" x2="40" y2="60" stroke="#44aa99" strokeWidth="2" />
</svg>
```
Text below: "Cryptographic receipts" / "Fail-closed by default" / "Auditable authority"

### 6. The Receipt Section — Make it a Statement

The current site shows the receipt JSON prominently with the line "Fail closed. Evidence, not logs."

In the receipt section of page.tsx, ADD this line below the ReceiptCard:
```tsx
<p className="mt-6 text-2xl font-medium text-secondary">Fail closed. Evidence, not logs.</p>
```

### 7. Remove Fake Social Proof

**File: `app/page.tsx`**

Remove the "Trusted by teams building the future" section entirely — the logo bar with fake company names (Apex Labs, Northstar, etc.) and fake stats (2.1M+ receipts, 14,000+ developers). PP doesn't have these numbers yet. This undermines trust rather than building it. Replace with nothing — just cut it.

### 8. Problem Statement — Add the Gut Punch

The current site has: "Your AI agent just pushed to main." with a large RED gate icon. This is visceral.

In page.tsx, the section "Today, AI agents authorize themselves." should be rewritten to hit harder:

Change headline to: "Your AI agent just pushed to production."
Change subheadline to: "No receipt. No review. No human."

Add a large red gate SVG between headline and the comparison cards (200px, red strokes):
```tsx
<div className="flex justify-center my-10">
  <svg width="200" height="200" viewBox="0 0 16 16" fill="none" style={{ shapeRendering: 'geometricPrecision' }}>
    <rect x="1.5" y="1.5" width="13" height="13" stroke="#aa4455" strokeWidth="1.2" fill="none" />
    <line x1="1.5" y1="8" x2="14.5" y2="8" stroke="#aa4455" strokeWidth="1.2" />
    <line x1="8" y1="1.5" x2="8" y2="5.5" stroke="#aa4455" strokeWidth="1.2" />
    <line x1="8" y1="10.5" x2="8" y2="14.5" stroke="#aa4455" strokeWidth="1.2" />
  </svg>
</div>
```

### 9. Copy Refinements

The new site reads like a pitch deck. Add the current site's voice back in. Apply these specific copy changes in page.tsx:

- "The authority layer for AI systems." → "Authority must exist before execution."
- "Three steps. One receipt. Full accountability." → "How it works."
- "The primitive that proves authority existed." → "The Receipt."
- "Every critical system has an authority layer. AI doesn't - until now." → "Add separation of powers to your AI systems."
- "One line of code. Full authority." → "One line. Full authority."
- "Authority for every consequential AI action." → "Designed for irreversible systems."
- "Authority before execution. Start now." → "The gate is always closed."

### 10. How It Works — Simplify to a Flow

Replace the 3-card grid with a clean horizontal flow like the current site:
```
[PR Created] → [Permission Protocol] → [Decision]
```
With "Blocked" / "Approved" outcomes below.

This should be a simple row of `chip` elements with arrows, not cards. Think minimal, like the current site.

## What NOT to Change
- Keep all the new pages (quickstart, pricing, contact, artifact pages)
- Keep the comparison table (it's good)
- Keep the use case grid
- Keep the CTA banner
- Keep all Framer Motion animations
- Keep the teal glow background gradient on the body

## After making changes:
1. Run `npx next build` to verify no errors
2. Commit with message "Branding pass: bold identity, iconic visuals, distinctive voice"
3. Push to origin website-v3
