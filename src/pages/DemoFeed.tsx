/**
 * DemoFeed — temporary page to preview Phase 7+8 components with mock data.
 * Visit /demo to see it. Remove this file after testing.
 */
import { Flame } from "lucide-react";
import { TweetCard } from "@/components/feed/TweetCard";
import { YourRequestCard } from "@/components/feed/YourRequestCard";
import { YourClaims } from "@/components/feed/YourClaims";
import { FloatingClaimBar } from "@/components/feed/FloatingClaimBar";
import type { FeedTweetRequest } from "@/hooks/use-feed";
import type { Engagement } from "@/types/database";

/* ───────── mock users ───────── */
const mockUsers = {
  alice: {
    id: "u-alice",
    x_user_id: "alice-x",
    x_username: "AliceCreates",
    x_display_name: "Alice ✨",
    x_avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
    credits: 800,
    role: "member" as const,
    trust_score: 95,
    is_banned: false,
    tweet_score: 72,
    ethos_score: 1450,
    is_verified: true,
    scores_updated_at: "2026-03-14T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-03-14T00:00:00Z",
  },
  bob: {
    id: "u-bob",
    x_user_id: "bob-x",
    x_username: "BobBuilds",
    x_display_name: "Bob 🔨",
    x_avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
    credits: 1200,
    role: "member" as const,
    trust_score: 88,
    is_banned: false,
    tweet_score: 58,
    ethos_score: null,
    is_verified: false,
    scores_updated_at: "2026-03-14T00:00:00Z",
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-03-14T00:00:00Z",
  },
  carol: {
    id: "u-carol",
    x_user_id: "carol-x",
    x_username: "CarolCrypto",
    x_display_name: "Carol",
    x_avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=carol",
    credits: 350,
    role: "member" as const,
    trust_score: 78,
    is_banned: false,
    tweet_score: null,
    ethos_score: 980,
    is_verified: true,
    scores_updated_at: "2026-03-14T00:00:00Z",
    created_at: "2026-02-15T00:00:00Z",
    updated_at: "2026-03-14T00:00:00Z",
  },
  you: {
    id: "u-you",
    x_user_id: "you-x",
    x_username: "JosephBricktop",
    x_display_name: "Joseph",
    x_avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=joseph",
    credits: 500,
    role: "admin" as const,
    trust_score: 100,
    is_banned: false,
    tweet_score: 85,
    ethos_score: 1800,
    is_verified: true,
    scores_updated_at: "2026-03-14T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-03-14T00:00:00Z",
  },
};

/* ───────── mock requests ───────── */
const mockRequests: FeedTweetRequest[] = [
  {
    id: "req-alice",
    user_id: "u-alice",
    tweet_url: "https://x.com/AliceCreates/status/1234567890",
    tweet_id: "1234567890",
    want_likes: true,
    want_comments: true,
    want_reposts: true,
    want_bookmarks: false,
    credits_deposited: 210,
    credits_remaining: 152,
    status: "active",
    cooldown_until: null,
    created_at: "2026-03-14T01:00:00Z",
    window_id: "2026-03-14_W1",
    likes_goal: 50,
    comments_goal: 100,
    reposts_goal: 20,
    bookmarks_goal: 0,
    likes_fulfilled: 23,
    comments_fulfilled: 12,
    reposts_fulfilled: 5,
    bookmarks_fulfilled: 0,
    submit_mode: "goal",
    user: mockUsers.alice,
  },
  {
    id: "req-bob",
    user_id: "u-bob",
    tweet_url: "https://x.com/BobBuilds/status/9876543210",
    tweet_id: "9876543210",
    want_likes: true,
    want_comments: true,
    want_reposts: false,
    want_bookmarks: true,
    credits_deposited: 150,
    credits_remaining: 98,
    status: "active",
    cooldown_until: null,
    created_at: "2026-03-14T01:05:00Z",
    window_id: "2026-03-14_W1",
    likes_goal: 30,
    comments_goal: 50,
    reposts_goal: 0,
    bookmarks_goal: 15,
    likes_fulfilled: 30,
    comments_fulfilled: 8,
    reposts_fulfilled: 0,
    bookmarks_fulfilled: 3,
    submit_mode: "goal",
    user: mockUsers.bob,
  },
  {
    id: "req-carol",
    user_id: "u-carol",
    tweet_url: "https://x.com/CarolCrypto/status/5555555555",
    tweet_id: "5555555555",
    want_likes: true,
    want_comments: true,
    want_reposts: true,
    want_bookmarks: true,
    credits_deposited: 80,
    credits_remaining: 80,
    status: "active",
    cooldown_until: null,
    created_at: "2026-03-14T01:10:00Z",
    window_id: "2026-03-14_W1",
    likes_goal: 0,
    comments_goal: 0,
    reposts_goal: 0,
    bookmarks_goal: 0,
    likes_fulfilled: 0,
    comments_fulfilled: 0,
    reposts_fulfilled: 0,
    bookmarks_fulfilled: 0,
    submit_mode: "credit",
    user: mockUsers.carol,
  },
];

/* ───────── your own request ───────── */
const myRequest: FeedTweetRequest = {
  id: "req-you",
  user_id: "u-you",
  tweet_url: "https://x.com/JosephBricktop/status/1111111111",
  tweet_id: "1111111111",
  want_likes: true,
  want_comments: true,
  want_reposts: true,
  want_bookmarks: true,
  credits_deposited: 300,
  credits_remaining: 187,
  status: "active",
  cooldown_until: null,
  created_at: "2026-03-14T00:55:00Z",
  window_id: "2026-03-14_W1",
  likes_goal: 80,
  comments_goal: 60,
  reposts_goal: 30,
  bookmarks_goal: 20,
  likes_fulfilled: 35,
  comments_fulfilled: 18,
  reposts_fulfilled: 9,
  bookmarks_fulfilled: 4,
  submit_mode: "goal",
  user: mockUsers.you,
};

/* ───────── mock engagements (what you already claimed) ───────── */
const myEngagements: Engagement[] = [
  {
    id: "eng-1",
    tweet_request_id: "req-bob",
    engager_user_id: "u-you",
    engagement_type: "like",
    status: "verified",
    credits_earned: 1,
    verified_at: "2026-03-14T02:00:00Z",
    claimed_at: "2026-03-14T02:00:00Z",
    created_at: "2026-03-14T02:00:00Z",
  },
  {
    id: "eng-2",
    tweet_request_id: "req-bob",
    engager_user_id: "u-you",
    engagement_type: "comment",
    status: "verified",
    credits_earned: 1,
    verified_at: "2026-03-14T02:01:00Z",
    claimed_at: "2026-03-14T02:01:00Z",
    created_at: "2026-03-14T02:01:00Z",
  },
];

/* ───────── DEMO PAGE ───────── */
export function DemoFeed() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              DEMO MODE — mock data, no real claims
            </div>
            <h1 className="text-2xl font-bold">Engagement Feed</h1>
            <p className="text-muted-foreground">
              Engage with tweets to collect credits
            </p>
          </div>

          {/* Phase info bar (engage phase) */}
          <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm">
            <Flame className="h-5 w-5 shrink-0 text-orange-500" />
            <div>
              <p className="font-semibold text-orange-700">
                Engage Phase — GO!
              </p>
              <p className="text-orange-600">
                <span className="font-mono font-bold">1:23:45</span> remaining.
                Engage with tweets below to collect credits!
              </p>
            </div>
          </div>

          {/* Your Claims */}
          <YourClaims
            engagements={myEngagements}
            requests={mockRequests}
          />

          {/* Your Request (pinned) */}
          <YourRequestCard request={myRequest} />

          {/* Feed cards */}
          <div className="space-y-4">
            {mockRequests.map((request) => (
              <TweetCard
                key={request.id}
                request={request}
                myEngagements={myEngagements.filter(
                  (e) => e.tweet_request_id === request.id
                )}
                isPreview={false}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating claim bar — toggle some items on cards to see it appear! */}
      <FloatingClaimBar />
    </div>
  );
}
