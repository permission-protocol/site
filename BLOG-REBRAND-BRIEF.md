# Blog Rebrand Brief

## Goal
Rebrand the blog index and all 3 article pages to match the Permission Protocol dark brand system. Currently they partially work (dark bg from CSS var inversion) but have their own inline styles that don't use the brand typography, spacing, or visual patterns from present.html.

## Files to modify
1. `blog/index.html` — blog listing page (466 lines)
2. `blog/aws-kiro-outage-ai-governance.html` — article (190 lines)
3. `blog/openclaw-security-nightmare.html` — article (193 lines)
4. `blog/signer-of-record-gap.html` — article (151 lines)
5. `styles.css` — add blog-specific brand styles

## DO NOT TOUCH
- present.html, brand.html, index.html (homepage), other pages
- Blog content text (keep all paragraphs, headings, quotes, lists)
- OG meta tags and SEO meta
- Image files (aws-kiro-outage.png, etc.)
- Article URLs

## Blog Index Page (blog/index.html)

### Current state
Has a gradient hero with "Infrastructure Intelligence" title, stat counters (3 analysis, 42K+ instances, 13hr), and article cards in a 2-column grid. Uses its own extensive inline `<style>` block.

### What to change
1. **Remove the entire inline `<style>` block** — move all blog styles to styles.css
2. **Add `class="dark-brand-page"` to `<body>`**
3. **Use `<link rel="stylesheet" href="../styles.css?v=11">` (cache bust)**
4. **Nav**: Use the brand lockup nav from the main site pages (gate SVG + PERMISSION/PROTOCOL wordmark). Copy the exact `<nav>` from index.html (the main homepage)
5. **Footer**: Copy the exact `<footer>` from index.html

### Hero redesign
Replace the gradient hero with the brand pattern:
```html
<section class="blog-hero">
  <div class="container">
    <div class="label">Latest Insights</div>
    <h1>Infrastructure Intelligence</h1>
    <p class="blog-hero-sub">Deep analysis on AI agent governance, cryptographic authorization, and the security patterns that scale with autonomous systems.</p>
  </div>
</section>
```

Remove the stat counters (3 analysis, 42K+, 13hr) — they're vanity metrics that don't add credibility with only 3 posts.

### Article cards
Keep the 2-column grid layout but use these brand styles:
```css
.blog-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

@media (max-width: 768px) {
  .blog-grid {
    grid-template-columns: 1fr;
  }
}

.blog-card {
  border: 1px solid #202020;
  background: #0c0c0c;
  padding: 28px;
  display: grid;
  gap: 16px;
  transition: border-color 0.2s ease;
}

.blog-card:hover {
  border-color: #333;
}

.blog-card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.blog-card-date {
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #6f6f6f;
}

.blog-card-tag {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1px solid #2a2a2a;
  padding: 4px 10px;
  color: #888;
}

.blog-card h2 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(20px, 2.5vw, 28px);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: #c8c8c8;
  margin: 0;
}

.blog-card p {
  font-family: 'Space Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #888;
  margin: 0;
}

.blog-card-link {
  font-family: 'Space Mono', monospace;
  font-size: 14px;
  color: #44aa99;
  text-decoration: none;
  letter-spacing: 0.02em;
}

.blog-card-link:hover {
  text-decoration: underline;
}
```

## Article Pages (all 3)

### Current state
Each has an inline `<style>` block defining `.blog-post`, heading sizes, blockquote styles, etc. Content is good. Typography is generic.

### What to change for ALL article pages
1. **Remove the entire inline `<style>` block**
2. **Add `class="dark-brand-page"` to `<body>`**
3. **Use `<link rel="stylesheet" href="../styles.css?v=11">`**
4. **Nav**: Same brand lockup nav as blog index (copy from main index.html)
5. **Footer**: Same footer as main site
6. **Add `← Back to Blog` link** at the top of article content:
```html
<a href="/blog" class="blog-back-link">← Back to Blog</a>
```

### Article styles (add to styles.css)
```css
/* Blog Article */
.blog-post {
  max-width: 720px;
  margin: 0 auto;
  padding: 4rem 1.5rem 6rem;
}

.blog-back-link {
  display: inline-block;
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  color: #6f6f6f;
  text-decoration: none;
  letter-spacing: 0.04em;
  margin-bottom: 2rem;
}

.blog-back-link:hover {
  color: #44aa99;
}

.blog-post h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: #e0e0e0;
  margin: 0 0 1rem;
}

.blog-post .blog-date {
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  color: #6f6f6f;
  letter-spacing: 0.06em;
  margin-bottom: 3rem;
  display: block;
}

.blog-post h2 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(22px, 3vw, 32px);
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.01em;
  color: #c8c8c8;
  margin: 3rem 0 1rem;
}

.blog-post h3 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(18px, 2vw, 24px);
  font-weight: 600;
  color: #c8c8c8;
  margin: 2rem 0 0.75rem;
}

.blog-post p {
  font-family: 'Space Mono', monospace;
  font-size: 15px;
  line-height: 1.75;
  color: #9f9f9f;
  margin: 0 0 1.25rem;
}

.blog-post a {
  color: #44aa99;
  text-decoration: none;
}

.blog-post a:hover {
  text-decoration: underline;
}

.blog-post blockquote {
  border-left: 3px solid #44aa99;
  margin: 2rem 0;
  padding: 1rem 0 1rem 1.5rem;
  background: rgba(68, 170, 153, 0.04);
}

.blog-post blockquote p {
  color: #b0b0b0;
  font-style: italic;
}

.blog-post ul, .blog-post ol {
  padding-left: 1.5rem;
  margin: 1rem 0;
}

.blog-post li {
  font-family: 'Space Mono', monospace;
  font-size: 15px;
  line-height: 1.75;
  color: #9f9f9f;
  margin-bottom: 0.5rem;
}

.blog-post li strong {
  color: #c8c8c8;
}

.blog-post pre {
  background: #0c0c0c;
  border: 1px solid #202020;
  padding: 1.25rem;
  overflow-x: auto;
  margin: 1.5rem 0;
  border-radius: 0;
}

.blog-post code {
  font-family: 'Space Mono', monospace;
  font-size: 13px;
}

.blog-post img {
  max-width: 100%;
  height: auto;
  margin: 2rem 0;
  border: 1px solid #1a1a1a;
}

/* Highlight boxes in articles */
.blog-post .highlight,
.blog-post .callout {
  background: rgba(68, 170, 153, 0.06);
  border: 1px solid #1a3a34;
  padding: 1.25rem 1.5rem;
  margin: 2rem 0;
}

.blog-post .highlight p,
.blog-post .callout p {
  color: #b0b0b0;
  margin-bottom: 0;
}

/* Deny-colored markers for threat/problem items */
.blog-post .threat-marker,
.blog-post .deny-text {
  color: #aa4455;
}

/* Permit-colored markers for solution items */
.blog-post .solution-marker,
.blog-post .permit-text {
  color: #44aa99;
}

/* Blog hero (index page) */
.blog-hero {
  padding: 6rem 1.5rem 4rem;
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.blog-hero .label {
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: #6f6f6f;
  margin-bottom: 16px;
}

.blog-hero h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(36px, 6vw, 64px);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.05;
  color: #e0e0e0;
  margin: 0 0 1rem;
}

.blog-hero-sub {
  font-family: 'Space Mono', monospace;
  font-size: clamp(14px, 1.4vw, 18px);
  color: #888;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}

/* Blog CTA at bottom of articles */
.blog-cta {
  margin-top: 4rem;
  padding: 2rem;
  border: 1px solid #202020;
  background: #0c0c0c;
  text-align: center;
  display: grid;
  gap: 16px;
  justify-items: center;
}

.blog-cta p {
  font-size: 14px;
  color: #888;
  margin: 0;
}

.blog-cta .cta-link {
  display: inline-block;
  color: #44aa99;
  border: 1px solid #44aa99;
  padding: 10px 16px;
  text-decoration: none;
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

### Article bottom CTA
Add at the end of each article's `.blog-post` div:
```html
<div class="blog-cta">
  <p>Add a deploy gate to your repo. Two minutes. Zero outages.</p>
  <a class="cta-link" href="/install">Install Deploy Gate →</a>
</div>
```

## Nav and Footer
Copy EXACTLY from the main index.html — including:
- Gate SVG with severed channel (blocked state) in nav
- PERMISSION / PROTOCOL wordmark
- Hamburger menu button for mobile
- Footer with brand lockup + © 2026

The nav currently in blog pages is slightly different (missing gate SVG, uses text logo without the SVG). It must match the main site nav exactly.

## Critical Rules
- Remove ALL inline `<style>` blocks from blog HTML files — styles go in styles.css
- Keep all article content text unchanged
- Keep all OG/Twitter meta tags unchanged
- Keep article image references unchanged
- `<link rel="stylesheet" href="../styles.css?v=11">` (note the `../` relative path)
- All pages get `<body class="dark-brand-page">`
- Gate SVGs in nav/footer use BLOCKED state (gap at y=5.5/10.5)
- Responsive: single column cards below 768px
- Delete this file (BLOG-REBRAND-BRIEF.md) after completing changes

## Commit
`feat: rebrand blog with presentation typography and dark brand system`
