# Social Card Templates

`social-cards.html` contains screenshottable card templates for Permission Protocol social proof assets.

## Brand System Used

- Colors: Void `#0a0a0a`, Ash `#1a1a1a`, Signal `#c8c8c8`, Permit `#44aa99`, Deny `#aa4455`
- Fonts: Space Grotesk, Space Mono
- Gate symbol: inline SVG matching `.reference/gate-symbol.tsx` geometry
- Blocked (`.blocked`): severed vertical channel in Deny color
- Signed (`.signed`): connected vertical channel in Permit color

## Included Card Templates

- GitHub README hero: `1280x640`
- Twitter / LinkedIn: `1200x628`
- Square post: `1080x1080`
- Story: `1080x1920`

Each size includes both variants:

- `.blocked`
- `.signed`

## File

- `assets/social-cards.html`

## Screenshot Notes

- Open `assets/social-cards.html` in a browser.
- Capture each `.card` element at its native dimensions.
- Keep card bounds exact to preserve OG/social crop compatibility.

## Variant Toggle

Cards are state-driven by CSS class:

- `class="card ... blocked"` for deny-by-default visual
- `class="card ... signed"` for permit-by-proof visual
