import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  ExternalLink,
  Check,
  Loader2,
} from "lucide-react";
import { CreatorName } from "@/components/ui/CreatorName";
import { useClaimEngagement } from "@/hooks/use-engagements";
import { formatCredits } from "@/lib/utils";
import type { FeedTweetRequest } from "@/hooks/use-feed";
import type { Engagement, EngagementType } from "@/types/database";

interface TweetCardProps {
  request: FeedTweetRequest;
  myEngagements: Engagement[];
}

const ENGAGEMENT_CONFIG = {
  like: {
    icon: Heart,
    label: "Like",
    credits: 1,
    color: "text-rose-500",
    bg: "bg-rose-50 hover:bg-rose-100",
    claimed: "bg-rose-100 text-rose-600",
  },
  comment: {
    icon: MessageCircle,
    label: "Comment",
    credits: 1,
    color: "text-blue-500",
    bg: "bg-blue-50 hover:bg-blue-100",
    claimed: "bg-blue-100 text-blue-600",
  },
  repost: {
    icon: Repeat2,
    label: "Repost",
    credits: 2,
    color: "text-green-500",
    bg: "bg-green-50 hover:bg-green-100",
    claimed: "bg-green-100 text-green-600",
  },
  bookmark: {
    icon: Bookmark,
    label: "Bookmark",
    credits: 2,
    color: "text-amber-500",
    bg: "bg-amber-50 hover:bg-amber-100",
    claimed: "bg-amber-100 text-amber-600",
  },
};

function extractTweetAuthor(url: string): string | null {
  const match = url.match(/(?:twitter\.com|x\.com)\/(\w+)\/status\//);
  return match ? match[1] : null;
}

export function TweetCard({ request, myEngagements }: TweetCardProps) {
  const claimMutation = useClaimEngagement();
  const [claimingType, setClaimingType] = useState<EngagementType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tweetAuthor = extractTweetAuthor(request.tweet_url);

  const wantedTypes: EngagementType[] = [];
  if (request.want_likes) wantedTypes.push("like");
  if (request.want_comments) wantedTypes.push("comment");
  if (request.want_reposts) wantedTypes.push("repost");
  if (request.want_bookmarks) wantedTypes.push("bookmark");

  const claimedTypes = new Set(myEngagements.map((e) => e.engagement_type));

  const handleClaim = async (type: EngagementType) => {
    setClaimingType(type);
    setError(null);
    try {
      await claimMutation.mutateAsync({
        tweetRequestId: request.id,
        engagementType: type,
      });
    } catch (err: any) {
      setError(err.message || "Failed to claim");
    } finally {
      setClaimingType(null);
    }
  };

  const usedCredits = request.credits_deposited - request.credits_remaining;
  const progressPct = Math.round(
    (usedCredits / request.credits_deposited) * 100
  );

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
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

      {/* Engagement actions */}
      <div className="flex flex-wrap gap-2">
        {wantedTypes.map((type) => {
          const config = ENGAGEMENT_CONFIG[type];
          const Icon = config.icon;
          const isClaimed = claimedTypes.has(type);
          const isClaiming = claimingType === type;

          if (isClaimed) {
            return (
              <div
                key={type}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${config.claimed}`}
              >
                <Check className="h-4 w-4" />
                {config.label} claimed
              </div>
            );
          }

          return (
            <button
              key={type}
              onClick={() => handleClaim(type)}
              disabled={isClaiming || claimMutation.isPending}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${config.bg} disabled:opacity-50`}
            >
              {isClaiming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icon className={`h-4 w-4 ${config.color}`} />
              )}
              {config.label}
              <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-bold">
                +{config.credits}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* Budget progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Budget</span>
          <span>
            {formatCredits(request.credits_remaining)} /{" "}
            {formatCredits(request.credits_deposited)} remaining
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary-400 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
