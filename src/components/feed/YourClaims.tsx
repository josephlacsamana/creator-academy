import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Check,
} from "lucide-react";
import { formatCredits } from "@/lib/utils";
import type { Engagement, EngagementType } from "@/types/database";
import type { FeedTweetRequest } from "@/hooks/use-feed";

interface YourClaimsProps {
  engagements: Engagement[];
  requests: FeedTweetRequest[];
}

const TYPE_ICON: Record<EngagementType, typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  repost: Repeat2,
  bookmark: Bookmark,
};

const TYPE_STYLE: Record<EngagementType, string> = {
  like: "bg-rose-50 text-rose-700 border-rose-200",
  comment: "bg-blue-50 text-blue-700 border-blue-200",
  repost: "bg-green-50 text-green-700 border-green-200",
  bookmark: "bg-amber-50 text-amber-700 border-amber-200",
};

export function YourClaims({ engagements, requests }: YourClaimsProps) {
  if (engagements.length === 0) return null;

  // Group engagements by request
  const requestMap = new Map(requests.map((r) => [r.id, r]));
  const totalCredits = engagements.reduce((sum, e) => sum + e.credits_earned, 0);

  return (
    <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-sm font-semibold text-green-800">
            Your Claims This Window
          </span>
        </div>
        <span className="text-sm font-bold text-green-700">
          +{formatCredits(totalCredits)} credits
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {engagements.map((eng) => {
          const Icon = TYPE_ICON[eng.engagement_type];
          const style = TYPE_STYLE[eng.engagement_type];
          const req = requestMap.get(eng.tweet_request_id);
          const username = req?.user?.x_username ?? "...";

          return (
            <div
              key={eng.id}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${style}`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>@{username}</span>
              <span className="font-bold">+{eng.credits_earned}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
