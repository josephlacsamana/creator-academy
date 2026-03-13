import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  ExternalLink,
  Check,
  Lock,
  Circle,
  CircleDot,
} from "lucide-react";
import { CreatorName } from "@/components/ui/CreatorName";
import { useClaimQueueStore } from "@/stores/claim-queue-store";
import { formatCredits } from "@/lib/utils";
import type { FeedTweetRequest } from "@/hooks/use-feed";
import type { Engagement, EngagementType } from "@/types/database";

interface TweetCardProps {
  request: FeedTweetRequest;
  myEngagements: Engagement[];
  isPreview?: boolean; // submit phase — show card but disable actions
}

const ENGAGEMENT_CONFIG = {
  like: {
    icon: Heart,
    label: "Like",
    activeLabel: "I liked",
    credits: 1,
    color: "text-rose-500",
    activeBg: "bg-rose-100 border-rose-300 text-rose-700",
    inactiveBg: "bg-card border-border hover:border-rose-300 hover:bg-rose-50",
    claimedBg: "bg-rose-100 border-rose-300 text-rose-600",
    fullBg: "bg-muted border-border text-muted-foreground",
  },
  comment: {
    icon: MessageCircle,
    label: "Comment",
    activeLabel: "I commented",
    credits: 1,
    color: "text-blue-500",
    activeBg: "bg-blue-100 border-blue-300 text-blue-700",
    inactiveBg: "bg-card border-border hover:border-blue-300 hover:bg-blue-50",
    claimedBg: "bg-blue-100 border-blue-300 text-blue-600",
    fullBg: "bg-muted border-border text-muted-foreground",
  },
  repost: {
    icon: Repeat2,
    label: "Repost",
    activeLabel: "I reposted",
    credits: 2,
    color: "text-green-500",
    activeBg: "bg-green-100 border-green-300 text-green-700",
    inactiveBg: "bg-card border-border hover:border-green-300 hover:bg-green-50",
    claimedBg: "bg-green-100 border-green-300 text-green-600",
    fullBg: "bg-muted border-border text-muted-foreground",
  },
  bookmark: {
    icon: Bookmark,
    label: "Bookmark",
    activeLabel: "I bookmarked",
    credits: 2,
    color: "text-amber-500",
    activeBg: "bg-amber-100 border-amber-300 text-amber-700",
    inactiveBg: "bg-card border-border hover:border-amber-300 hover:bg-amber-50",
    claimedBg: "bg-amber-100 border-amber-300 text-amber-600",
    fullBg: "bg-muted border-border text-muted-foreground",
  },
} as const;

function extractTweetAuthor(url: string): string | null {
  const match = url.match(/(?:twitter\.com|x\.com)\/(\w+)\/status\//);
  return match ? match[1]! : null;
}

/** Check if a goal-mode engagement type is fully fulfilled */
function isTypeFull(request: FeedTweetRequest, type: EngagementType): boolean {
  if (request.submit_mode !== "goal") return false;
  switch (type) {
    case "like":
      return request.likes_goal > 0 && request.likes_fulfilled >= request.likes_goal;
    case "comment":
      return request.comments_goal > 0 && request.comments_fulfilled >= request.comments_goal;
    case "repost":
      return request.reposts_goal > 0 && request.reposts_fulfilled >= request.reposts_goal;
    case "bookmark":
      return request.bookmarks_goal > 0 && request.bookmarks_fulfilled >= request.bookmarks_goal;
  }
}

/** Get the goal and fulfilled counts for a type */
function getTypeProgress(
  request: FeedTweetRequest,
  type: EngagementType
): { goal: number; fulfilled: number } | null {
  if (request.submit_mode !== "goal") return null;
  switch (type) {
    case "like":
      return request.likes_goal > 0
        ? { goal: request.likes_goal, fulfilled: request.likes_fulfilled }
        : null;
    case "comment":
      return request.comments_goal > 0
        ? { goal: request.comments_goal, fulfilled: request.comments_fulfilled }
        : null;
    case "repost":
      return request.reposts_goal > 0
        ? { goal: request.reposts_goal, fulfilled: request.reposts_fulfilled }
        : null;
    case "bookmark":
      return request.bookmarks_goal > 0
        ? { goal: request.bookmarks_goal, fulfilled: request.bookmarks_fulfilled }
        : null;
  }
}

/** Get wanted engagement types based on submit mode */
function getWantedTypes(request: FeedTweetRequest): EngagementType[] {
  if (request.submit_mode === "goal") {
    const types: EngagementType[] = [];
    if (request.likes_goal > 0) types.push("like");
    if (request.comments_goal > 0) types.push("comment");
    if (request.reposts_goal > 0) types.push("repost");
    if (request.bookmarks_goal > 0) types.push("bookmark");
    return types;
  }
  const types: EngagementType[] = [];
  if (request.want_likes) types.push("like");
  if (request.want_comments) types.push("comment");
  if (request.want_reposts) types.push("repost");
  if (request.want_bookmarks) types.push("bookmark");
  return types;
}

export function TweetCard({ request, myEngagements, isPreview }: TweetCardProps) {
  const { addItem, removeItem, hasItem, isClaiming } = useClaimQueueStore();
  const tweetAuthor = extractTweetAuthor(request.tweet_url);

  const wantedTypes = getWantedTypes(request);
  const claimedTypes = new Set(myEngagements.map((e) => e.engagement_type));

  /** Toggle an engagement type in/out of the claim queue */
  const handleToggle = (type: EngagementType) => {
    if (isPreview || isClaiming) return;

    const config = ENGAGEMENT_CONFIG[type];
    if (hasItem(request.id, type)) {
      removeItem(request.id, type);
    } else {
      addItem({
        requestId: request.id,
        tweetId: request.tweet_id,
        engagementType: type,
        username: request.user.x_username,
        credits: config.credits,
      });
    }
  };

  // Budget progress
  const totalCredits = request.credits_deposited;
  const remaining = request.credits_remaining;
  const usedPct = totalCredits > 0 ? Math.round(((totalCredits - remaining) / totalCredits) * 100) : 0;

  return (
    <div
      className={`rounded-xl border bg-card p-5 space-y-4 transition-all ${
        isPreview ? "border-border opacity-80" : "border-border"
      }`}
    >
      {/* Creator info */}
      <div className="flex items-center gap-3">
        <img
          src={request.user.x_avatar_url}
          alt=""
          className="h-10 w-10 rounded-full"
        />
        <div className="min-w-0 flex-1">
          <CreatorName user={request.user} size="sm" />
          <p className="text-xs text-muted-foreground">
            @{request.user.x_username}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">{formatCredits(remaining)}</p>
          <p className="text-[10px] text-muted-foreground">credits left</p>
        </div>
      </div>

      {/* Tweet link */}
      <a
        href={request.tweet_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-lg border border-border bg-accent/50 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
      >
        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate">
          {tweetAuthor
            ? `Open @${tweetAuthor}'s tweet on X`
            : "Open tweet on X"}
        </span>
      </a>

      {/* Per-type progress (goal mode only) */}
      {request.submit_mode === "goal" && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {wantedTypes.map((type) => {
            const progress = getTypeProgress(request, type);
            if (!progress) return null;
            const full = progress.fulfilled >= progress.goal;
            const config = ENGAGEMENT_CONFIG[type];
            const Icon = config.icon;
            return (
              <span
                key={type}
                className={`inline-flex items-center gap-1 ${full ? "text-green-600 font-medium" : ""}`}
              >
                <Icon className="h-3 w-3" />
                {progress.fulfilled}/{progress.goal}
                {full && <Check className="h-3 w-3" />}
              </span>
            );
          })}
        </div>
      )}

      {/* Engagement toggle buttons */}
      <div className="flex flex-wrap gap-2">
        {wantedTypes.map((type) => {
          const config = ENGAGEMENT_CONFIG[type];
          const Icon = config.icon;
          const isClaimed = claimedTypes.has(type);
          const isFull = isTypeFull(request, type);
          const isQueued = hasItem(request.id, type);

          // Already claimed (verified)
          if (isClaimed) {
            return (
              <div
                key={type}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium ${config.claimedBg}`}
              >
                <Check className="h-4 w-4" />
                {config.activeLabel}
                <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-bold">
                  +{config.credits}
                </span>
              </div>
            );
          }

          // FCFS: type is full
          if (isFull) {
            return (
              <div
                key={type}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium ${config.fullBg}`}
              >
                <Lock className="h-3.5 w-3.5" />
                {config.label}
                <span className="text-[10px] font-bold uppercase">FULL</span>
              </div>
            );
          }

          // Preview mode: disabled
          if (isPreview) {
            return (
              <div
                key={type}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-medium text-muted-foreground"
              >
                <Icon className="h-4 w-4" />
                {config.label}
                <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-bold">
                  +{config.credits}
                </span>
              </div>
            );
          }

          // Active toggle: queued or not
          return (
            <button
              key={type}
              onClick={() => handleToggle(type)}
              disabled={isClaiming}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                isQueued ? config.activeBg : config.inactiveBg
              }`}
            >
              {isQueued ? (
                <CircleDot className="h-4 w-4" />
              ) : (
                <Circle className={`h-4 w-4 ${config.color}`} />
              )}
              {isQueued ? config.activeLabel : config.label}
              <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-bold">
                +{config.credits}
              </span>
            </button>
          );
        })}
      </div>

      {/* Hint */}
      {!isPreview && (
        <p className="text-[11px] text-muted-foreground">
          Toggle what you engaged with, then claim all at once from the bar below.
        </p>
      )}

      {/* Budget progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Funded</span>
          <span>
            {formatCredits(remaining)} / {formatCredits(totalCredits)} remaining
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary-400 transition-all"
            style={{ width: `${usedPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
