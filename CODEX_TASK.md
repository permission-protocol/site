# Task: Add GitHub OAuth Authentication + Multi-Tenant Scoping

## Context
This is a Next.js 14 App Router site deployed on Vercel. It has a review dashboard at `/review` and detail pages at `/review/[id]` that show deploy request approvals. Currently there's NO auth — API keys are hardcoded in env vars. We need to add GitHub OAuth so users log in and see only their org's requests.

## Requirements

### 1. Install NextAuth.js v4
```bash
npm install next-auth@4
```
Use v4 (not v5/Auth.js) for stability with Next.js 14.

### 2. Create auth configuration
- File: `app/api/auth/[...nextauth]/route.ts`
- GitHub OAuth provider
- JWT strategy (no database session)
- Env vars: `GITHUB_ID`, `GITHUB_SECRET`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- Include user's GitHub organizations in the session (fetch from GitHub API in the `jwt` callback using the access token)
- Store `accessToken`, `login` (GitHub username), and `orgs` (array of org login names) in the JWT/session

### 3. Create SessionProvider wrapper
- File: `app/providers.tsx` — wraps children in `<SessionProvider>`
- Add to `app/layout.tsx` — wrap `{children}` with `<Providers>`

### 4. Create login page
- File: `app/login/page.tsx`
- Clean, dark design matching existing site (use existing Tailwind classes: `bg-void`, `text-signal`, `text-permit`, `border-border`, `bg-card`, `bg-ash`)
- "Sign in with GitHub" button (use `signIn("github")`)
- Brief description: "Sign in to review and approve deploy requests for your organization."
- PP logo/branding consistent with the rest of the site

### 5. Protect review routes with middleware
- File: `middleware.ts` (root level)
- Protect `/review` and `/review/*` routes
- Redirect unauthenticated users to `/login`
- Use `getToken` from `next-auth/jwt` to check auth
- Leave all other routes (landing pages, API routes) public
- DO NOT protect `/api/auth/*` routes

### 6. Add user menu to header
- The header is in `app/layout.tsx` inside the `<LayoutChrome>` component
- Actually, look at the actual header component — it may be in a separate file
- Add a small user avatar + dropdown in the top-right of the navigation
- Show GitHub avatar + username
- Dropdown: "Sign out" link
- Only show when authenticated (check session client-side)

### 7. Update review API routes to be tenant-aware
- File: `app/api/reviews/route.ts` (list endpoint)
- Instead of hardcoded `getPPAuthHeaders()`, derive tenant from the user's session
- For now: map the user's first GitHub org to a PP tenant ID via an env var mapping
  - Env var format: `TENANT_MAP` = `{"roca-ventures": "cmlk31ll80001zilbjpjr8kyl"}`
  - Fallback to existing hardcoded tenant for backward compat
- File: `app/api/review/[id]/route.ts` (detail endpoint) — same pattern
- Files: `app/api/review/[id]/approve/route.ts`, `reject/route.ts`, `merge/route.ts` — same pattern

### 8. Types
- Create `types/next-auth.d.ts` to extend the Session type with `accessToken`, `login`, and `orgs`

## Important Constraints
- Next.js 14 App Router (NOT Pages Router)
- Use `"use client"` only where needed (SessionProvider, login form, user menu)
- Keep all existing functionality working — the site must still build
- Don't modify the landing pages, pricing, contact, etc.
- Keep existing design tokens/colors
- ESLint: escape apostrophes with `&apos;`
- The header component may be in `components/` or inline in `layout.tsx` — check first

## Testing
After implementation, `npx next build` must pass with zero errors.

## Do NOT
- Do NOT create a database or Prisma schema
- Do NOT use Auth.js v5 (use next-auth v4)
- Do NOT modify the review UI components (ReviewPageClient, ReviewDashboard)
- Do NOT remove any existing API route functionality
