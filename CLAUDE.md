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
VITE_RAPIDAPI_KEY=<stored in .env>
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

### Twitter241 / Twttr API (RapidAPI) — Engagement Verification
- **Provider:** Twitter241 by davethebeast on RapidAPI
- **Plan:** Basic (free) — 500 requests/month, 1000 req/hour rate limit
- **API Key:** stored in .env as VITE_RAPIDAPI_KEY
- **Host:** twitter241.p.rapidapi.com
- **Endpoints used:** `/post-comments` (verify comments), `/post-retweets` (verify reposts)
- **No likers endpoint** — likes are trust-based (auto-verified)
- **Bookmarks** — trust-based (no API can verify)
- **Scale plan:** Upgrade to Pro ($25/mo, 100K requests) when needed; optionally add TwitterAPI.io for reposts+comments at scale

## Database
- Schema: migrations 001 through 006 — 001-005 executed, 006 pending
- Migrations: `001_initial_schema` + `002_credit_supply_and_escrow` + `003_fix_admin_rls_recursion` + `004_user_scores` + `005_claim_engagement` + `006_leaderboard`
- Tables: `users`, `tweet_requests`, `engagements`, `transactions`, `credit_supply`
- RLS enabled on all tables + "Authenticated users can read all profiles" policy (added in 005)
- RPC functions: `submit_tweet_with_escrow`, `cancel_tweet_request`, `toggle_tweet_request_pause`, `claim_engagement`, `get_leaderboard`
- `users` table includes: `tweet_score`, `ethos_score`, `is_verified` (blue badge), `scores_updated_at` — migration 004 executed
- `claim_engagement` RPC: auto-verified for MVP, transfers credits from escrow to engager — migration 005 executed

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

## Engagement Exchange v2 — Windowed System

### Window Schedule (5 daily windows, 3hrs each, PH time = UTC+8)

| Window | PH Time | UTC Time |
|--------|---------|----------|
| W1 | 8:30 AM – 11:30 AM | 00:30 – 03:30 |
| W2 | 2:30 PM – 5:30 PM | 06:30 – 09:30 |
| W3 | 5:30 PM – 8:30 PM | 09:30 – 12:30 |
| W4 | 8:30 PM – 11:30 PM | 12:30 – 15:30 |
| W5 | 11:30 PM – 2:30 AM | 15:30 – 18:30 |

2-hour gap between windows. Admin-adjustable.

### Window Phases (per 3-hour window)

**Submit + Preview (1 hour):**
- Drop tweet link, set engagement goals (or raw budget)
- 1 tweet max per user per window
- Minimum deposit: 50 credits
- Feed shows submitted requests immediately (sorted by highest credits on top)
- Cards have shaking/glow animation to build hype
- Countdown timer to engage phase
- Users can "Open on X" and engage early — just can't claim yet
- Toggle buttons ("I liked", "I commented") are gray/disabled with tooltip
- Your own request visible (marked as yours, can't engage)

**Engage (1.5 hours):**
- Toggle buttons go LIVE (yellow #F5B526)
- Claiming happens via floating claim bar (not per-card buttons)
- FCFS per engagement type (likes goal met → no more likes, comments may still have budget)
- Auto-funnel: credits you collect → auto-add to your active request's budget
- No active request → credits go to balance normally
- Top-up: manually add credits from balance to your request anytime
- Feed sorted by available credits (highest on top), reorders on refresh/return only
- Cards you've fully engaged with disappear from feed
- **Late submissions allowed** during first 1hr of engage phase (locked during last 30min)
- Late submitters see warning: "X min left to get engagement"

**Cooldown (30 min):**
- Verification settles
- Unused credits from request → returned to balance
- Countdown timer to next window

### Submission Timeline (using W1 as example)
```
8:30 ──── 9:30 ──────── 10:30 ──── 11:00 ──── 11:30
│ Submit + │    Engage Phase       │  Cooldown  │
│ Preview  │                       │            │
├─── Can submit ──────┤ Can't sub. ┤            │
│    Can't claim      ├──── Can claim ──────────┤
```

### Submit UX — Two Modes

**Goal Mode (default):** User inputs how many likes, comments, reposts, bookmarks they want. System calculates total credits. User sets initial deposit (min 50, can be less than total — auto-funnel fills the rest).

**Credit Mode (toggle):** Raw budget slider + engagement type checkboxes. No per-type goals, just total budget with FCFS across all types. For advanced users.

### Feed Card Design
- Shows creator info (avatar, name, badges)
- Available credits (big, prominent) + funded progress bar (e.g., "152/210 funded")
- "Open on X" link
- Per-type progress counters (e.g., "23/50 likes", "12/100 comments")
- Toggle buttons: "I liked" / "I commented" / "I reposted" / "I bookmarked"
- Your own request: shows auto-funnel status ("Budget growing — you're engaging!") + "Add credits" button
- Budget empty → card grays out, shows "BUDGET EMPTY"
- Type full → that toggle shows "FULL" (grayed out)

### Floating Claim Bar
- Sticky bar at bottom of screen, only visible when pending claims exist
- Collapsed: "🟡 3 ready to claim [Claim All]"
- Expanded: shows individual chips (👍 @creator1 +1cr, 💬 @creator2 +1cr) with [×] to remove
- "Claim All" → batch verify + claim everything at once
- During claiming: spinner, all interactions disabled
- Claimed chips animate out, bar slides away when empty

### Credit Flow Per Window
1. **Submit:** Balance → deposit (min 50) → request budget (escrowed)
2. **Engage:** User engages others → collects credits → auto-funnel to active request budget
3. **FCFS:** Others engage your tweet → credits transfer from your budget per type until goals met or budget empty
4. **Settlement:** Window ends → unused credits from request → returned to balance
5. **No submission:** Earned credits go to balance normally

### "Your Claims" Section
- Top of feed: sticky section showing your claimed engagements this window
- Cards move from main feed → "Your Claims" after fully engaging
- Partial claims stay in both sections (claimed types shown, remaining types still in feed)

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

#### Phase 3: Basic Engagement Feed + Verification ← DONE (will be upgraded by Window System)
- [x] Tweet card component (creator info, "Open on X" link, engagement buttons with credit amounts, budget progress bar)
- [x] Engagement feed page (shows active tweets from other users, auto-refreshes every 30s)
- [x] "Open on X" link + "Claim" buttons per engagement type (Like/Comment/Repost/Bookmark)
- [x] claim_engagement RPC (migration 005: validates, prevents duplicates, transfers credits, auto-completes when budget exhausted)
- [x] Credit transfer on verified engagement (auto-verified for MVP)
- [x] React Query hooks (useFeed, useClaimEngagement)
- [x] RLS policy: authenticated users can read all profiles (needed for feed user joins)
- [x] RapidAPI integration — Twitter241 (free plan, 500 req/mo) for comment + repost verification
- [x] Verification service (src/lib/twitter-verify.ts) — comments via /post-comments, reposts via /post-retweets
- [x] Likes + bookmarks trust-based (auto-verified, no API available for likers)
- [x] 5-min response caching (multiple claims on same tweet share one API call, saves requests)
- [ ] (OPTIONAL / EMERGENCY) TwitterAPI.io — pay-per-use ($0.15/1K requests), has retweeters + replies endpoints, no likers. Use as backup if Twitter241 goes down or hits limits. No free tier.

#### Phase 4: Dashboard Stats + Leaderboard ← DONE
- [x] Dashboard stats: spent/collected today + weekly stats
- [x] Leaderboard with weekly/monthly/all-time tabs (get_leaderboard RPC, migration 006)
- [x] Full transaction history (on Profile page, already done in Phase 2)
- [ ] Community stats on landing page (total users, engagements — nice-to-have)

#### Phase 5: Window System — Database + State Engine ← DONE
- [x] Computed schedule from UTC constants (src/lib/window-engine.ts)
- [x] Window state engine: compute current window + phase from UTC time (submit/engage/cooldown/between)
- [x] Modified `tweet_requests` table: add `window_id`, per-type goal columns + fulfilled counters + `submit_mode`
- [x] Constraint: 1 tweet request per user per window (partial unique index)
- [x] TypeScript types for window state, phases, schedule (WindowPhase, WindowInfo, SubmitMode)
- [x] `useCurrentWindow` hook — returns current window, phase, time remaining, next window (updates every second)
- [x] Window status banner component (shows current phase + countdown timer, visible on all pages)
- [x] Between-windows state: "Next window opens in X:XX" countdown
- [x] Migration 007: new columns + indexes + 4 new RPCs (submit_tweet_v2, claim_engagement_v2, top_up_request, settle_window)

#### Phase 6: New Submit UX (Goal Mode + Credit Mode) ← DONE
- [x] Goal Mode (default): per-type stepper inputs (+/- buttons) for likes, comments, reposts, bookmarks
- [x] Credit Mode (toggle): raw budget slider + engagement type checkboxes
- [x] Seamless toggle between modes with ArrowRightLeft button
- [x] Minimum deposit: 50 credits, deposit slider, can deposit less than total goal (auto-funnel fills rest)
- [x] Submission rules enforced: 1 per window, blocked during cooldown/between windows, blocked last 30min of engage
- [x] Warning for late submitters: "only X minutes of engagement time remaining"
- [x] Info box explaining credit gap + auto-funnel
- [x] After submit → redirect to feed
- [x] `useSubmitTweetV2` hook calling `submit_tweet_v2` RPC with window_id + per-type goals

#### Phase 7: Windowed Feed + Live Leaderboard ← DONE
- [x] Feed sorted by available credits (highest on top) via credits_remaining DESC
- [x] Submit+Preview phase: cards with disabled toggles + phase info bar
- [x] Engage phase: toggle buttons go live with verify-then-claim flow
- [x] FCFS per engagement type: type full → "FULL" badge (Lock icon, grayed out)
- [x] Per-type progress counters on each card (e.g., "23/50 likes")
- [x] Funded progress bar per card (credits_remaining / credits_deposited)
- [x] Your own request card (YourRequestCard): pinned, auto-funnel indicator, per-type progress
- [x] "Your Claims" sticky section at top of feed (YourClaims component)
- [x] Feed window-filtered by current window_id
- [x] Live polling every 10s during engage phase, 30s otherwise
- [x] Late submission support (prompt to submit during first 60min of engage)
- [x] `useClaimEngagementV2` hook calling `claim_engagement_v2` RPC
- [x] Phase-aware empty states and info bars (submit/engage/cooldown/between)

#### Phase 8: Floating Claim Bar ← DONE
- [x] "I engaged" toggle buttons on feed cards (replaces direct claim buttons)
- [x] Toggling "I liked" → adds to floating claim bar queue (Zustand claim-queue-store)
- [x] Floating sticky bar at bottom of screen (only visible when pending claims exist)
- [x] Collapsed view: "X ready to claim +Y credits [Claim All]" with pulsing status dot
- [x] Expanded view: individual chips with creator name + type + credit amount + [×] remove
- [x] "Claim All" → batch verify (Twitter241 API) + claim all at once
- [x] Individual chip tap → claim just that one
- [x] Loading state: spinner on bar, all interactions disabled during verification
- [x] Claimed chips animate out (Framer Motion), bar slides away when empty
- [x] Bar hidden completely when nothing to claim

#### Phase 9: Auto-Funnel + Top-Up + Settlement ← DONE
- [x] Auto-funnel: handled in `claim_engagement_v2` RPC — routes earned credits to engager's active request in same window
- [x] Auto-funnel indicator on YourRequestCard: "Zap Auto-funnel active" badge
- [x] If no active request → earned credits go to balance normally (handled in RPC)
- [x] Top-up: "Add credits from balance" button on YourRequestCard with slider + amount input
- [x] `useTopUpRequest` hook calling `top_up_request` RPC
- [x] Window settlement: `useAutoSettle` hook auto-triggers `settle_window` during cooldown phase (once per window)
- [x] `useSettleWindow` hook calling `settle_window` RPC
- [x] Settlement transaction logs handled in RPC ("Window X settled: Y credits returned")
- [x] `claim_engagement_v2` RPC already handles auto-funnel routing (migration 007)

#### Phase 10: Window Polish + Animations
- [ ] Shaking/glow animation on cards during Submit+Preview phase (Framer Motion)
- [ ] Smooth card reorder animations when feed updates
- [ ] Claim success animations (checkmark, chip fly-out)
- [ ] Window phase transition animations (Submit → Engage → Cooldown)
- [ ] Countdown timer animations (pulse when <5 min remaining)
- [ ] Toast notifications: "Window 3 is open!", "Engage phase starting!", "Your request collected 45 credits!"
- [ ] Sound/haptic feedback on claim success (optional, mobile)
- [ ] Cooldown summary screen (your window stats: credits spent, collected, engagements given/received)

#### Phase 11: Admin Panel
- [ ] Admin route guard
- [ ] User management (search, ban, adjust credits)
- [ ] Credit supply dashboard (circulating, locked, total)
- [ ] Unlock credits from locked pool
- [ ] Window schedule management (adjust times, enable/disable windows)
- [ ] Analytics dashboard (per-window stats: submissions, engagements, credits flow)
- [ ] Verification rate monitoring (Twitter241 API usage tracking)

#### Phase 12: Cooldown + Anti-Abuse
- [ ] Auto-cooldown on engagement spikes
- [ ] Rate limiting per user per window
- [ ] Trust score calculation
- [ ] Self-engagement prevention (already in RPC, but add UI safeguards)
- [ ] Duplicate engagement prevention (already in RPC)
- [ ] Suspicious pattern detection (e.g., always engaging only the cheapest types)

#### Phase 13: Polish + Responsive
- [ ] Mobile responsive refinements (floating claim bar on mobile, touch-friendly toggles)
- [ ] Framer Motion page transitions
- [ ] Loading/empty/error states for all window phases
- [ ] Toast notifications system
- [ ] PWA setup (push notifications for window openings)

---

### PART 2: BRAND & AGENCY ACCOUNTS (Revenue)

#### Phase 14: Brand Account System
- [ ] Brand/Agency account type (separate from creator)
- [ ] Brand signup flow + approval process
- [ ] Brand dashboard (different from creator dashboard)
- [ ] Credit purchase flow ($100 for 5K credits, adjustable pricing)
- [ ] Payment integration (Stripe or similar)
- [ ] Mint purchased credits from locked supply

#### Phase 15: Brand Content + Promoted Feed
- [ ] Brand content submission (same flow, premium placement)
- [ ] Promoted/pinned content at top of engagement feed (above regular window requests)
- [ ] "Sponsored" badge on brand content
- [ ] Higher credit rates for brand engagement (e.g., Like = 3cr, Comment = 5cr)
- [ ] Brand analytics (impressions, engagements, spend)

---

### PART 2.5: CREDIT STORE + RETENTION

#### Phase 16: Creator Credit Store + Retention Mechanics
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

#### Phase 17: Hook Generator
- [ ] AI-powered hook writing UI (input: topic/niche → output: hook variations)
- [ ] Hook style templates (question, bold claim, story, stat, etc.)
- [ ] Save/favorite hooks
- [ ] Credit cost per generation

#### Phase 18: X Profile Audit
- [ ] Pull profile data (bio, banner, pinned tweet, metrics)
- [ ] AI analysis + scoring (bio clarity, CTA, banner quality, niche alignment)
- [ ] Actionable suggestions with before/after examples
- [ ] Credit cost per audit

#### Phase 19: Hook Analyzer
- [ ] Paste tweet URL → breakdown of hook mechanics
- [ ] Score: scroll-stopping power, curiosity gap, emotional trigger
- [ ] Compare hooks side-by-side
- [ ] Credit cost per analysis

#### Phase 20: Brand & Niche Positioning
- [ ] Guided questionnaire (expertise, audience, values, competitors)
- [ ] AI-generated positioning statement + niche recommendation
- [ ] Content angle suggestions based on positioning
- [ ] Credit cost per session

#### Phase 21: Content Pillar Tracker
- [ ] Define 3–5 content pillars
- [ ] Tag posts by pillar
- [ ] Weekly balance tracker (are you posting evenly across pillars?)
- [ ] Suggestions when a pillar is underrepresented
- [ ] Credit cost: free to track, costs credits for AI suggestions

#### Phase 22: Viral Tweet Pattern Library
- [ ] Curated library of proven tweet formats/templates
- [ ] Filter by category (thread, single, engagement bait, educational, story)
- [ ] "Use this template" → pre-filled draft with placeholders
- [ ] Community-submitted patterns (voted by creators)
- [ ] Credit cost per template unlock (or free browse, pay to use)

#### Phase 23: Story-to-Content Generator
- [ ] Input: paste a story, experience, or lesson learned
- [ ] AI outputs: tweet thread, single tweet variations, hook options
- [ ] Tone selector (professional, casual, spicy, inspirational)
- [ ] Credit cost per generation

---

### PART 4: ADVANCED TOOLS (Post-Launch)

#### Phase 24: Reply Game Coach
- [ ] Surface high-traffic tweets in creator's niche
- [ ] AI-suggested reply drafts
- [ ] Track reply performance (likes, follows gained)
- [ ] Credit cost per batch of suggestions

#### Phase 25: Post Autopsy
- [ ] Paste any tweet URL → full performance breakdown
- [ ] Analysis: hook strength, format, timing, engagement ratio
- [ ] "Why it worked" / "Why it flopped" AI explanation
- [ ] Credit cost per autopsy

#### Phase 26: Collab Matchmaker
- [ ] Match creators by niche, audience size, engagement rate
- [ ] Suggest collab types (QT exchange, thread collab, Space co-host)
- [ ] In-app collab requests
- [ ] Credit cost per match batch

#### Phase 27: Content Calendar
- [ ] Weekly/monthly calendar view
- [ ] Assign content pillars to days
- [ ] AI-suggested posting schedule based on audience activity
- [ ] Reminders + streak tracking
- [ ] Credit cost for AI scheduling, free for manual planning
