# Cleanup Pass — Tighten the Site

## 1. Hero Headline Change

**File: `src/components/Hero.tsx`**

Change the hero headline from "The gate is always closed." to:

```
AI agents shouldn't authorize their own actions.
```

Keep everything else (gate SVG icon, subheadline, CTAs). The gate icon still works as a visual symbol — it's the text that needs to shift from "gate" framing to "authority" framing.

## 2. Kill the "Authority must exist before execution" Section

**File: `app/page.tsx`**

Remove the entire SectionBlock that says "Authority must exist before execution." with the floating gate SVG. It's redundant — the hero already communicates this. Cutting it improves pacing.

The section to remove is the one between the before/after comparison and the "How it works" section. It looks like this:
```tsx
<SectionBlock
  headline="Authority must exist before execution."
  subheadline="Permission Protocol sits between AI decisions..."
>
  <div className="flex justify-center">
    <svg ...gate svg... />
  </div>
</SectionBlock>
```

Delete this entire SectionBlock.

## 3. Receipt Section — Make it the Second Hero

**File: `app/page.tsx`**

The Receipt section should feel like a second climactic moment. Changes:

- Move "Fail closed. Evidence, not logs." ABOVE the ReceiptCard, as a large statement line (text-3xl font-semibold)
- Below the ReceiptCard, add the "See a live receipt →" link
- The ReceiptCard itself should be centered, not in a grid with a link beside it

Replace the Receipt SectionBlock content with:
```tsx
<SectionBlock
  headline="The Receipt."
  subheadline="Every authorized action produces a signed, portable, verifiable receipt."
>
  <p className="text-3xl font-semibold text-secondary">Fail closed. Evidence, not logs.</p>
  <div className="mt-8 flex justify-center">
    <ReceiptCard />
  </div>
  <div className="mt-6 text-center">
    <Link href="/r/demo" className="inline-flex items-center font-semibold text-permit">
      See a live receipt <ArrowRight className="ml-2 h-4 w-4" />
    </Link>
  </div>
</SectionBlock>
```

## 4. Nav Responsive Fix

**File: `src/components/SiteHeader.tsx`**

The nav may be stacking/overflowing on medium viewports. Ensure:
- The PERMISSION/PROTOCOL wordmark text is hidden on mobile (below md breakpoint) — just show the gate SVG icon
- Nav links should collapse into a hamburger on mobile (or just hide middle links and keep CTA)
- On desktop, all links should fit on one line

Quick fix: Add `hidden md:inline` to the wordmark text spans:
```tsx
<span className="hidden md:inline text-sm font-medium tracking-[0.08em]">
  <span className="text-signal">PERMISSION</span>
  <span className="text-permit">/</span>
  <span className="text-signal">PROTOCOL</span>
</span>
```

## 5. Bottom CTA — Use "The gate is always closed."

**File: `app/page.tsx`**

The final SectionBlock (CTA) should now say "The gate is always closed." — this becomes a callback/bookend instead of the opener. It should already be this from the branding pass, but verify it reads:

```tsx
<SectionBlock
  headline="The gate is always closed."
  subheadline="Free for individual developers. Enterprise plans for teams that need enforcement at scale."
>
  <CTABanner />
</SectionBlock>
```

## 6. Section Spacing Refinement

**File: `app/page.tsx`**

After removing the redundant section, the flow should be:

1. Hero — "AI agents shouldn't authorize their own actions."
2. Problem — "Your AI agent just pushed to production." (red gate + before/after)
3. How it works — chip flow + code
4. The Receipt — statement + centered card
5. Comparison — "Add separation of powers to your AI systems."
6. SDK — "One line. Full authority." + code tabs
7. Use cases — "Designed for irreversible systems."
8. CTA — "The gate is always closed."

That's 8 sections including hero. Each should have strong visual differentiation. Verify this is the order after the redundant section is removed.

## After making changes:
1. Run `npx next build` to verify no errors
2. Commit with message "Cleanup: hero headline, remove redundant section, receipt prominence, nav fix"
3. Push to origin website-v3
