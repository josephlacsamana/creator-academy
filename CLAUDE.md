# Creator Academy Tools

## Overview
A web platform hub for X creators in the Bricktopians community (~600 members). A suite of growth tools powered by a capped credit economy. The first tool is **Engagement Exchange** — a credit-based engagement system where creators support each other on X.

## Tech Stack
- **Frontend:** Vite + React 18 + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui patterns (Radix primitives)
- **Theme:** Light, clean, Typefully-inspired. Primary color: `#F5B526`
- **Backend/DB:** Supabase (Postgres + Auth + Edge Functions)
- **Auth:** Supabase Auth with X/Twitter OAuth 2.0
- **State:** TanStack React Query + Zustand
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Routing:** React Router v7

## Commands
```bash
pnpm install     # Install dependencies
pnpm dev         # Start dev server (localhost:5173)
pnpm build       # Production build
pnpm preview     # Preview production build
```

## Project Structure
```
src/
  components/
    layout/        # Shell, Sidebar, MobileNav
    feed/          # Tweet cards, engagement UI (Phase 3)
    ui/            # Shared UI components
  pages/           # Route pages (Landing, Dashboard, Feed, Submit, etc.)
  stores/          # Zustand stores (auth-store)
  hooks/           # React Query hooks
  lib/             # Supabase client, utils, verification service
  types/           # TypeScript types (database.ts)
supabase/
  migrations/      # SQL migrations
  functions/       # Edge Functions (verification, Phase 3)
```

## Environment Variables
```
VITE_SUPABASE_URL=https://dtmvbxjrqianwweazfwv.supabase.co
VITE_SUPABASE_ANON_KEY=<stored in .env>
```

## External Services (CONFIGURED)
### Supabase
- **Project:** creator-academy (nano, Tokyo region ap-northeast-1)
- **URL:** https://dtmvbxjrqianwweazfwv.supabase.co
- **Migrations:** 001_initial_schema.sql + 002_credit_supply_and_escrow.sql + 003_fix_admin_rls_recursion.sql + 004_user_scores.sql — all executed
- **Tables live:** users, tweet_requests, engagements, transactions, credit_supply
- **RPC functions live:** submit_tweet_with_escrow, cancel_tweet_request, toggle_tweet_request_pause

### X Developer App
- **App ID:** 32567869 (app name: 20323643399284490024josephweb3)
- **Auth method:** Twitter (Deprecated/OAuth 1.0) — OAuth 2.0 had persistence bug on Supabase free tier
- **Consumer Key (API Key):** stored in Supabase Auth provider config
- **Consumer Secret (API Secret):** stored in Supabase Auth provider config
- **OAuth 2.0 Client ID:** X2R1WVZSZWVIdWVFS3dmZlhqel86MTpjaQ (kept for future migration)
- **Callback URL:** https://dtmvbxjrqianwweazfwv.supabase.co/auth/v1/callback
- **Supabase Auth:** Twitter (Deprecated) provider enabled, "Allow users without email" ON
- **App permissions:** Read
- **RLS fix applied:** Admin policies use auth.jwt() instead of subquery to avoid infinite recursion

## Database
- Schema: `supabase/migrations/001_initial_schema.sql` + `002_credit_supply_and_escrow.sql`
- Tables: `users`, `tweet_requests`, `engagements`, `transactions`, `credit_supply`
- RLS enabled on all tables
- RPC functions: `submit_tweet_with_escrow`, `cancel_tweet_request`, `toggle_tweet_request_pause`
- `users` table includes: `tweet_score`, `ethos_score`, `is_verified` (blue badge), `scores_updated_at` — migration 004 executed

## Credit Economy
### Supply
- **Capped supply:** 21 million credits max (like Bitcoin)
- **Initial circulation:** 1 million credits at launch
- **Unlocking:** Additional credits are gradually unlocked from the locked pool as needed
- New creator accounts get 500 credits from the circulating supply

### Engagement Credits (Engagement Exchange)
- Like = 1 credit | Comment = 1 credit | Repost = 2 credits | Bookmark = 2 credits
- Credits escrowed on tweet submission, transferred on verified engagement
- Admin (Joseph) has unlimited credits, pays 5 credits per engagement on his posts
- **Admin content bonus:** Engaging with Joseph's posts gives creators **2x credits** (e.g., Like = 2cr instead of 1cr). The extra credits come from the total supply pool. Joseph has unlimited credits but won't abuse it

### Tool Usage
- All tools cost credits to use (e.g., Hook Generator costs X credits per generation)
- Spent credits **return to the circulating supply pool** — they are NOT burned
- This keeps credits flowing: engage → collect credits → use tools → credits return to pool → other creators collect them through engagement
- The economy is a closed loop, not deflationary

### Brand & Agency Accounts
- Special account type (not creator accounts)
- Purchase credits with real money — starting at **$100 for 5K credits** ($0.02/engagement), adjustable based on demand
- Purchased credits are minted from the locked supply (not circulating)
- Brand content is **promoted** — always appears at the top of the feed
- Brands pay **higher credit rates per engagement** (e.g., Like = 3 credits, Comment = 5 credits instead of 1/1)
- This incentivizes creators to engage with brand content first (more credits per action)
- Revenue model for the platform

### Creator Credit Purchases
- Creators can **buy credits directly from the platform** (optional, never required)
- Pricing TBD (lower rate than brands, e.g., $10 for 1K credits)
- Purchased credits minted from locked supply
- The platform is still free to use — buying credits is a shortcut, not a requirement
- Additional revenue stream alongside brand accounts

## Creator Reputation & Scores
Displayed next to creator names throughout the platform (feed, leaderboard, profile, etc.):
- **TweetScore** — fetched via TweetScore API, shows account quality/influence score
- **Ethos Network Score** — fetched via Ethos API, on-chain reputation score
- **Blue Badge** — verified checkmark status from X (pulled during auth or via API)
- Scores cached in `users` table, refreshed periodically (daily or on profile view)
- Displayed as badges/chips next to the creator's display name

## Verification
- Uses RapidAPI Twitter scraper (NOT official X API)
- Likes/Reposts/Comments verified via API
- Bookmarks are trust-based (cannot be verified)
- Batch verification with 5-min caching to reduce API costs

---

## Build Phases

---

### PART 1: ENGAGEMENT EXCHANGE (Core Platform)

#### Phase 1: Project Setup + Auth ← DONE
- [x] Vite + React + TypeScript scaffold
- [x] Tailwind + custom theme (#F5B526)
- [x] Base layout (Sidebar, Shell, MobileNav, bottom tabs)
- [x] All page stubs (Landing, Dashboard, Feed, Submit, MyRequests, Leaderboard, Profile, Tools)
- [x] Supabase client + auth store
- [x] SQL migration with full schema + RLS
- [x] TypeScript types for all database tables
- [x] Landing page with full tools showcase
- [x] Tools grid page with Coming Soon badges
- [x] Set up X Developer App (OAuth 2.0 PKCE) — App ID 32567869, Client ID configured
- [x] Set up Supabase project + run migrations (001 + 002)
- [x] Configure Supabase Auth with Twitter (Deprecated/OAuth 1.0) provider — OAuth 2.0 had persistence bug on free tier
- [x] Test X OAuth login flow end-to-end — WORKING (login, profile creation, 500 credits, redirect to dashboard)
- [x] Fix RLS infinite recursion on admin policies (replaced subquery with auth.jwt())
- [x] Fetch & store blue badge status on auth (reads from X metadata)
- [x] Creator name component with score badges (TweetScore, Ethos, blue check)
- [x] Migration 004: user_scores (tweet_score, ethos_score, is_verified, scores_updated_at)
- [ ] TweetScore / Smart Followers API — skipped for now ($49/mo min), researching free alternatives
- [x] Ethos Network API integration — FREE, fetches score on signup + refreshes every 24h, cached in users table

#### Phase 2: Credit Economy + Submit Tweet ← DONE
- [x] Credit supply table (total supply, circulating, locked) + migration
- [x] Submit tweet form (URL input, engagement type checkboxes, budget slider)
- [x] Tweet URL parser + validation (with visual feedback)
- [x] Escrow logic (atomic RPC: deduct credits + create request + log transaction)
- [x] Cancel/refund RPC (returns remaining credits to user)
- [x] Pause/resume toggle RPC
- [x] My Requests page (list, status badges, pause/cancel actions, credit progress bar)
- [x] Dashboard stats (real data: spent today, collected today, pending, active tweets)
- [x] Dashboard recent activity (last 5 transactions)
- [x] Transaction history on Profile page (full list with type badges)
- [x] React Query hooks (useMyRequests, useSubmitTweet, useCancelRequest, useTogglePause, useTransactions, useDashboardStats)

#### Phase 3: Engagement Feed + Verification
- [ ] Tweet card component (preview, actions, credits)
- [ ] Engagement feed with filters
- [ ] "Engage" → open on X + "Claim" flow
- [ ] RapidAPI integration (select provider, test)
- [ ] Verification service (likes, reposts, comments)
- [ ] Bookmark auto-verify (trust-based)
- [ ] Batch verification + caching
- [ ] Credit transfer on verified engagement

#### Phase 4: Dashboard Stats + Leaderboard
- [ ] Real dashboard stats (given/received today, weekly)
- [ ] Leaderboard (weekly/monthly/all-time)
- [ ] Full transaction history
- [ ] Community stats on landing page

#### Phase 5: Admin Panel
- [ ] Admin route guard
- [ ] User management (search, ban, adjust credits)
- [ ] Credit supply dashboard (circulating, locked, burned, total)
- [ ] Unlock credits from locked pool
- [ ] Analytics dashboard
- [ ] Cooldown settings
- [ ] Verification rate monitoring

#### Phase 6: Cooldown + Anti-Abuse
- [ ] Auto-cooldown on engagement spikes
- [ ] Rate limiting per user
- [ ] Trust score calculation
- [ ] Self-engagement + duplicate prevention

#### Phase 7: Polish + Responsive
- [ ] Mobile responsive refinements
- [ ] Framer Motion page transitions
- [ ] Loading/empty/error states
- [ ] Toast notifications
- [ ] PWA setup

---

### PART 2: BRAND & AGENCY ACCOUNTS (Revenue)

#### Phase 8: Brand Account System
- [ ] Brand/Agency account type (separate from creator)
- [ ] Brand signup flow + approval process
- [ ] Brand dashboard (different from creator dashboard)
- [ ] Credit purchase flow ($100 for 5K credits, adjustable pricing)
- [ ] Payment integration (Stripe or similar)
- [ ] Mint purchased credits from locked supply

#### Phase 9: Brand Content + Promoted Feed
- [ ] Brand content submission (same flow, premium placement)
- [ ] Promoted/pinned content at top of engagement feed
- [ ] "Sponsored" badge on brand content
- [ ] Higher credit rates for brand engagement (e.g., Like = 3cr, Comment = 5cr)
- [ ] Brand analytics (impressions, engagements, spend)

---

### PART 2.5: CREDIT STORE + RETENTION

#### Phase 10: Creator Credit Store + Retention Mechanics
- [ ] Buy credits UI (credit packages: e.g., 500cr/$5, 1K/$10, 5K/$40)
- [ ] Payment integration (Stripe, shared with brand flow)
- [ ] Mint purchased credits from locked supply
- [ ] Daily login bonus (10–20 credits, claimed once per day)
- [ ] Engagement streaks (7-day streak → 1.5x credits for a day)
- [ ] Milestone challenges ("comment on 20 posts this week → bonus 100 credits", "like 100 posts today → 200 credits")
- [ ] Referral system (invite a creator → both get 200 credits)
- [ ] Admin content bonus (engaging with Joseph's content → 2x credits, sourced from total pool)

---

### PART 3: CREATOR TOOLS (AI-Powered)

All tools cost credits per use (credits return to circulating supply).

#### Phase 11: Hook Generator
- [ ] AI-powered hook writing UI (input: topic/niche → output: hook variations)
- [ ] Hook style templates (question, bold claim, story, stat, etc.)
- [ ] Save/favorite hooks
- [ ] Credit cost per generation

#### Phase 12: X Profile Audit
- [ ] Pull profile data (bio, banner, pinned tweet, metrics)
- [ ] AI analysis + scoring (bio clarity, CTA, banner quality, niche alignment)
- [ ] Actionable suggestions with before/after examples
- [ ] Credit cost per audit

#### Phase 13: Hook Analyzer
- [ ] Paste tweet URL → breakdown of hook mechanics
- [ ] Score: scroll-stopping power, curiosity gap, emotional trigger
- [ ] Compare hooks side-by-side
- [ ] Credit cost per analysis

#### Phase 14: Brand & Niche Positioning
- [ ] Guided questionnaire (expertise, audience, values, competitors)
- [ ] AI-generated positioning statement + niche recommendation
- [ ] Content angle suggestions based on positioning
- [ ] Credit cost per session

#### Phase 15: Content Pillar Tracker
- [ ] Define 3–5 content pillars
- [ ] Tag posts by pillar
- [ ] Weekly balance tracker (are you posting evenly across pillars?)
- [ ] Suggestions when a pillar is underrepresented
- [ ] Credit cost: free to track, costs credits for AI suggestions

#### Phase 16: Viral Tweet Pattern Library
- [ ] Curated library of proven tweet formats/templates
- [ ] Filter by category (thread, single, engagement bait, educational, story)
- [ ] "Use this template" → pre-filled draft with placeholders
- [ ] Community-submitted patterns (voted by creators)
- [ ] Credit cost per template unlock (or free browse, pay to use)

#### Phase 17: Story-to-Content Generator
- [ ] Input: paste a story, experience, or lesson learned
- [ ] AI outputs: tweet thread, single tweet variations, hook options
- [ ] Tone selector (professional, casual, spicy, inspirational)
- [ ] Credit cost per generation

---

### PART 4: ADVANCED TOOLS (Post-Launch)

#### Phase 18: Reply Game Coach
- [ ] Surface high-traffic tweets in creator's niche
- [ ] AI-suggested reply drafts
- [ ] Track reply performance (likes, follows gained)
- [ ] Credit cost per batch of suggestions

#### Phase 19: Post Autopsy
- [ ] Paste any tweet URL → full performance breakdown
- [ ] Analysis: hook strength, format, timing, engagement ratio
- [ ] "Why it worked" / "Why it flopped" AI explanation
- [ ] Credit cost per autopsy

#### Phase 20: Collab Matchmaker
- [ ] Match creators by niche, audience size, engagement rate
- [ ] Suggest collab types (QT exchange, thread collab, Space co-host)
- [ ] In-app collab requests
- [ ] Credit cost per match batch

#### Phase 21: Content Calendar
- [ ] Weekly/monthly calendar view
- [ ] Assign content pillars to days
- [ ] AI-suggested posting schedule based on audience activity
- [ ] Reminders + streak tracking
- [ ] Credit cost for AI scheduling, free for manual planning
