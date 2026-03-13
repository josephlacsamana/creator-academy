import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Zap,
  ExternalLink,
  Check,
  Plus,
  Loader2,
  Minus,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useTopUpRequest } from "@/hooks/use-top-up-request";
import { formatCredits } from "@/lib/utils";
import type { FeedTweetRequest } from "@/hooks/use-feed";

interface YourRequestCardProps {
  request: FeedTweetRequest;
  canTopUp?: boolean; // true during submit + engage phases
}

const TYPE_CONFIG = [
  { key: "like" as const, icon: Heart, label: "Likes", goalKey: "likes_goal" as const, fulfilledKey: "likes_fulfilled" as const },
  { key: "comment" as const, icon: MessageCircle, label: "Comments", goalKey: "comments_goal" as const, fulfilledKey: "comments_fulfilled" as const },
  { key: "repost" as const, icon: Repeat2, label: "Reposts", goalKey: "reposts_goal" as const, fulfilledKey: "reposts_fulfilled" as const },
  { key: "bookmark" as const, icon: Bookmark, label: "Bookmarks", goalKey: "bookmarks_goal" as const, fulfilledKey: "bookmarks_fulfilled" as const },
] as const;

function extractTweetAuthor(url: string): string | null {
  const match = url.match(/(?:twitter\.com|x\.com)\/(\w+)\/status\//);
  return match ? match[1]! : null;
}

export function YourRequestCard({ request, canTopUp }: YourRequestCardProps) {
  const user = useAuthStore((s) => s.user);
  const topUpMutation = useTopUpRequest();
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(50);

  const tweetAuthor = extractTweetAuthor(request.tweet_url);
  const remaining = request.credits_remaining;
  const deposited = request.credits_deposited;
  const usedPct = deposited > 0 ? Math.round(((deposited - remaining) / deposited) * 100) : 0;
  const isGoalMode = request.submit_mode === "goal";
  const isCompleted = request.status === "completed";
  const balance = user?.credits ?? 0;
  const effectiveTopUp = Math.max(1, Math.min(topUpAmount, balance));

  const handleTopUp = async () => {
    if (effectiveTopUp <= 0 || effectiveTopUp > balance) return;
    try {
      await topUpMutation.mutateAsync({
        requestId: request.id,
        amount: effectiveTopUp,
      });
      setShowTopUp(false);
      setTopUpAmount(50);
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <div className="rounded-xl border-2 border-primary-300 bg-primary-50/30 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
            Your Request
          </span>
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
              <Check className="h-3 w-3" /> Completed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              <Zap className="h-3 w-3" /> Auto-funnel active
            </span>
          )}
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
        className="flex items-center gap-2 rounded-lg border border-primary-200 bg-white/50 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/80"
      >
        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate">
          {tweetAuthor ? `Your tweet (@${tweetAuthor})` : "Your tweet"}
        </span>
      </a>

      {/* Per-type progress (goal mode) */}
      {isGoalMode && (
        <div className="grid grid-cols-2 gap-2">
          {TYPE_CONFIG.map(({ key, icon: Icon, label, goalKey, fulfilledKey }) => {
            const goal = request[goalKey];
            const fulfilled = request[fulfilledKey];
            if (goal <= 0) return null;
            const full = fulfilled >= goal;
            const pct = Math.min(100, Math.round((fulfilled / goal) * 100));
            return (
              <div
                key={key}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  full
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-border bg-white/50"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{label}</span>
                    <span>
                      {fulfilled}/{goal}
                      {full && <Check className="ml-0.5 inline h-3 w-3" />}
                    </span>
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${full ? "bg-green-500" : "bg-primary-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Budget progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Budget</span>
          <span>
            {formatCredits(remaining)} / {formatCredits(deposited)} remaining
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary-400 transition-all"
            style={{ width: `${usedPct}%` }}
          />
        </div>
      </div>

      {/* Top-up section */}
      {canTopUp && !isCompleted && (
        <>
          {!showTopUp ? (
            <button
              onClick={() => setShowTopUp(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary-300 bg-white/60 px-4 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-white/90"
            >
              <Plus className="h-4 w-4" />
              Add credits from balance
              <span className="text-xs text-muted-foreground">
                ({formatCredits(balance)} available)
              </span>
            </button>
          ) : (
            <div className="rounded-lg border border-primary-200 bg-white/60 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Top up your request</p>
                <button
                  onClick={() => setShowTopUp(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTopUpAmount(Math.max(1, topUpAmount - 10))}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-muted"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <div className="flex-1">
                  <input
                    type="range"
                    min={1}
                    max={Math.max(1, balance)}
                    value={effectiveTopUp}
                    onChange={(e) => setTopUpAmount(Number(e.target.value))}
                    className="w-full accent-primary-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setTopUpAmount(Math.min(balance, topUpAmount + 10))}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-muted"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">{formatCredits(effectiveTopUp)} credits</span>
                <button
                  onClick={handleTopUp}
                  disabled={topUpMutation.isPending || effectiveTopUp <= 0 || effectiveTopUp > balance}
                  className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {topUpMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Add"
                  )}
                </button>
              </div>

              {topUpMutation.isError && (
                <p className="text-xs text-red-500">
                  {(topUpMutation.error as Error)?.message ?? "Top-up failed"}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Auto-funnel hint */}
      {!isCompleted && (
        <p className="text-[11px] text-muted-foreground">
          Credits you collect by engaging with others are automatically added to this request's budget.
        </p>
      )}
    </div>
  );
}
