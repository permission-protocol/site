# Social Card Templates

`social-cards.html` provides screenshottable Permission Protocol social cards with exact gate-symbol geometry and a global state toggle.

## Brand System

- Colors:
  - Void `#0a0a0a` (background)
  - Signal `#c8c8c8` (text)
  - Permit `#44aa99` (signed accents)
  - Deny `#aa4455` (blocked accents)
- Fonts:
  - Space Grotesk (`500` for `PERMISSION`, `300` for `PROTOCOL`)
  - Space Mono (system labels/tagline)

## Gate Symbol (Critical)

The gate is a square boundary (`rect`) with a horizontal barrier and vertical channel.

- Blocked: channel is severed at the barrier (gap between `y=5.5` and `y=10.5`)
- Signed: channel is continuous (`y=1.5` to `y=14.5`)

## Included Sizes

- GitHub README hero: `1280x640`
- Twitter / LinkedIn: `1200x628`
- Square: `1080x1080`
- Story: `1080x1920`

Each card is a fixed-dimension, self-contained `div` for direct screenshot capture.

## State Toggle

Use the top toggle button to switch all cards between:

- `blocked` (default)
- `signed`

The toggle updates both card classes and gate SVG path segments.
