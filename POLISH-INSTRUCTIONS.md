# Polish Pass — PP Website V3

This is a visual polish pass. The structure and content are correct — do NOT change any text content, section order, or page structure. Only improve visual quality, animations, and micro-interactions.

## 1. Hero Flow Diagram (DiagramFlow.tsx + homepage section 1)
- Make the diagram BIGGER — it should take up more visual space on the right side of the hero
- The Permission Protocol center node needs a real radial teal (#44aa99) glow using box-shadow or a CSS radial gradient behind it
- Add a subtle pulse animation to the PP node (opacity 0.6 → 1.0, 2s ease infinite)
- Add a small "receipt" icon (a document with checkmark) that animates downward along the flow line from PP to "Authorized Action" on page load
- The flow line arrows should be teal colored, not grey

## 2. Receipt Card (ReceiptCard.tsx)
- Add proper 3D perspective flip animation: use CSS transform-style: preserve-3d, rotateY(180deg) on hover/click
- The card needs more depth: larger box-shadow (0 20px 60px rgba(0,0,0,0.5)), slight translateY(-4px) on hover
- Front side: the "✓ ACTION AUTHORIZED" header should use a green (#10B981) background pill/badge, not just text
- Back side (JSON): add proper syntax highlighting — keys in teal (#44aa99), string values in green (#10B981), punctuation in #666
- Add a subtle "flip" hint — a small icon or text saying "Click to see JSON" on the front side corner

## 3. Comparison Table (ComparisonTable.tsx)
- Each row should animate in with a 150ms stagger delay (row 1 → row 2 → row 3 → row 4 → row 5)
- The final row (Authority / Permission Protocol) should have:
  - A teal left border (3px solid #44aa99)
  - A subtle teal background glow (rgba(68,170,153,0.08))
  - The text "Permission Protocol" in teal (#44aa99) and bold
  - A brief teal pulse animation when it appears (glow intensifies then settles)
- Other rows should be in muted #888 text, the PP row should be bright and prominent

## 4. Code Blocks (CodeBlock.tsx)
- Add proper syntax highlighting:
  - Python keywords (from, import, def, return) in teal (#44aa99)
  - Strings in green (#10B981)
  - Comments (#) in #666
  - Decorators (@) in teal
  - Function names in #c8c8c8 (primary text)
- The terminal tab should look like a real macOS terminal:
  - Add three dots (red #EF4444, yellow #F59E0B, green #10B981) in the top-left corner
  - Dark background (#111111)
  - The $ prompt in #666, commands in #c8c8c8
  - Success lines (✓) in green (#10B981)
  - Warning/waiting lines in amber (#F59E0B)
- Add a copy button in the top-right corner of each code block (clipboard icon)
- Tab buttons should have an active state with teal underline

## 5. Section Spacing & Separators
- Increase vertical padding between sections to py-28 or py-32 (generous breathing room)
- Add subtle gradient divider lines between sections: a thin horizontal line that fades from transparent → rgba(68,170,153,0.2) → transparent
- Each section should animate in with Framer Motion: initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}

## 6. Headlines
- H2 headlines (section titles) should be text-4xl md:text-5xl (bigger and bolder)
- Subheadlines should be text-lg text-secondary with more line-height (relaxed)
- Add slight letter-spacing to small uppercase labels (tracking-[0.15em])

## 7. CTA Buttons
- Primary buttons (teal background): add hover effect — subtle glow (box-shadow: 0 0 20px rgba(68,170,153,0.3)) + slight scale(1.02)
- Secondary buttons (outlined): add hover fill effect — background transitions from transparent to rgba(68,170,153,0.1)
- All buttons: add transition-all duration-200

## 8. Navigation
- The nav should have a subtle backdrop-blur and background opacity that increases on scroll (glassmorphism effect)
- Add smooth scroll behavior for "How It Works" anchor link
- The "Get Started" button in nav should match the teal primary CTA style

## 9. Use Case Cards (UseCaseGrid.tsx)
- Cards should have a subtle border (border-[#222])
- On hover: border transitions to teal (#44aa99), slight translateY(-2px) lift, subtle teal glow
- Icons should be teal colored
- Add transition-all duration-200 to cards

## 10. Replay Page (/replay/[id])
- The timeline dots should be colored: blue (#44aa99) for normal events, red (#EF4444) for blocked
- When "ACTION BLOCKED" appears, add:
  - A red (#EF4444) pulse animation on the X icon
  - The text should be larger (text-2xl font-bold)
  - A red glow effect (box-shadow: 0 0 30px rgba(239,68,68,0.3))
  - The timeline line should visually "break" — it stops abruptly at the block point
- The approved timeline should end with a green checkmark with subtle green glow

## 11. Receipt Proof Page (/r/[id])
- The receipt card should be centered with generous whitespace
- Add a "Verified" badge with green background pill at the top
- The signature section should feel institutional — maybe a subtle seal/stamp icon
- Add share buttons: "Copy Link" and "Copy JSON" with click feedback

## 12. General Polish
- Add smooth scroll behavior to the html element (scroll-behavior: smooth in globals.css)
- Ensure all interactive elements have focus-visible outlines (accessibility)
- The footer should have a subtle top border in #222
- Add a subtle gradient at the top of the page behind the hero (very subtle teal radial gradient at the top center, fading to void)

## IMPORTANT
- Do NOT change any text content or section structure
- Do NOT add new sections or pages
- Only improve visual quality, animations, and interactions
- Keep all changes within the existing file structure
- After making changes, commit everything with message "Polish pass: visual quality, animations, micro-interactions"
- Run `npx next build` to verify no build errors before committing
