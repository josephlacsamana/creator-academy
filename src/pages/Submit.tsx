import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { useSubmitTweet } from "@/hooks/use-tweet-requests";
import { extractTweetId, formatCredits } from "@/lib/utils";
import {
  Send,
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  AlertCircle,
  CheckCircle2,
  Minus,
  Plus,
  Loader2,
  ExternalLink,
} from "lucide-react";

const CREDIT_COSTS = {
  like: 1,
  comment: 1,
  repost: 2,
  bookmark: 2,
} as const;

const ENGAGEMENT_OPTIONS = [
  { key: "likes" as const, label: "Likes", icon: Heart, cost: CREDIT_COSTS.like },
  { key: "comments" as const, label: "Comments", icon: MessageCircle, cost: CREDIT_COSTS.comment },
  { key: "reposts" as const, label: "Reposts", icon: Repeat2, cost: CREDIT_COSTS.repost },
  { key: "bookmarks" as const, label: "Bookmarks", icon: Bookmark, cost: CREDIT_COSTS.bookmark },
];

export function Submit() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const submitTweet = useSubmitTweet();

  const [tweetUrl, setTweetUrl] = useState("");
  const [engagements, setEngagements] = useState({
    likes: true,
    comments: false,
    reposts: false,
    bookmarks: false,
  });
  const [budget, setBudget] = useState(50);

  if (!user) return null;

  const tweetId = extractTweetId(tweetUrl);
  const isValidUrl = !!tweetId;
  const hasEngagement = Object.values(engagements).some(Boolean);

  // Calculate min cost per round (one engagement of each selected type)
  const costPerRound = ENGAGEMENT_OPTIONS.reduce(
    (sum, opt) => sum + (engagements[opt.key] ? opt.cost : 0),
    0
  );

  // Estimated engagements
  const estimatedEngagements = costPerRound > 0 ? Math.floor(budget / costPerRound) : 0;

  const canSubmit =
    isValidUrl &&
    hasEngagement &&
    budget >= 1 &&
    budget <= user.credits &&
    !submitTweet.isPending;

  const handleSubmit = async () => {
    if (!canSubmit || !tweetId) return;

    try {
      await submitTweet.mutateAsync({
        tweetUrl,
        tweetId,
        wantLikes: engagements.likes,
        wantComments: engagements.comments,
        wantReposts: engagements.reposts,
        wantBookmarks: engagements.bookmarks,
        creditsDeposited: budget,
      });
      navigate("/my-requests");
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Submit Tweet</h1>
        <p className="text-muted-foreground">
          Post a tweet URL to get engagement from the community
        </p>
      </div>

      {/* Tweet URL input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Tweet URL</label>
        <div className="relative">
          <input
            type="url"
            placeholder="https://x.com/you/status/123456789"
            value={tweetUrl}
            onChange={(e) => setTweetUrl(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 pr-10 text-sm outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
          />
          {tweetUrl && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isValidUrl ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
            </div>
          )}
        </div>
        {tweetUrl && !isValidUrl && (
          <p className="text-xs text-destructive">
            Enter a valid X/Twitter post URL (e.g., https://x.com/user/status/123)
          </p>
        )}
        {isValidUrl && (
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary-500 hover:underline"
          >
            Open tweet <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Engagement types */}
      <div className="space-y-3">
        <label className="text-sm font-medium">
          What engagement do you want?
        </label>
        <div className="grid grid-cols-2 gap-3">
          {ENGAGEMENT_OPTIONS.map((opt) => {
            const selected = engagements[opt.key];
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() =>
                  setEngagements((prev) => ({
                    ...prev,
                    [opt.key]: !prev[opt.key],
                  }))
                }
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                  selected
                    ? "border-primary-300 bg-primary-50/50"
                    : "border-border bg-card hover:border-muted-foreground/30"
                }`}
              >
                <opt.icon
                  className={`h-5 w-5 ${
                    selected ? "text-primary-500" : "text-muted-foreground"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {opt.cost} credit{opt.cost > 1 ? "s" : ""} each
                  </p>
                </div>
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                    selected
                      ? "border-primary-400 bg-primary-400"
                      : "border-border"
                  }`}
                >
                  {selected && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {!hasEngagement && (
          <p className="text-xs text-destructive">
            Select at least one engagement type
          </p>
        )}
      </div>

      {/* Budget slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Credit Budget</label>
          <span className="text-sm text-muted-foreground">
            Balance: {formatCredits(user.credits)}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setBudget(Math.max(1, budget - 10))}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-muted"
          >
            <Minus className="h-4 w-4" />
          </button>

          <div className="flex-1">
            <input
              type="range"
              min={1}
              max={Math.max(1, user.credits)}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-primary-400"
            />
          </div>

          <button
            type="button"
            onClick={() => setBudget(Math.min(user.credits, budget + 10))}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/50 px-4 py-3">
          <div>
            <p className="text-2xl font-bold">{formatCredits(budget)}</p>
            <p className="text-xs text-muted-foreground">credits to escrow</p>
          </div>
          {costPerRound > 0 && (
            <div className="text-right">
              <p className="text-lg font-semibold">
                ~{estimatedEngagements}
              </p>
              <p className="text-xs text-muted-foreground">
                estimated engagements
              </p>
            </div>
          )}
        </div>

        {budget > user.credits && (
          <p className="text-xs text-destructive">
            Not enough credits. You have {formatCredits(user.credits)}.
          </p>
        )}
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-3.5 text-base font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitTweet.isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="h-5 w-5" />
            Submit Tweet — {formatCredits(budget)} credits
          </>
        )}
      </button>

      {submitTweet.isError && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {(submitTweet.error as Error)?.message ?? "Something went wrong"}
        </div>
      )}

      {/* Info box */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">How it works</p>
        <ul className="mt-2 space-y-1">
          <li>
            Credits are escrowed from your balance when you submit.
          </li>
          <li>
            Other creators engage with your tweet and collect credits.
          </li>
          <li>
            You can pause or cancel anytime — unused credits are refunded.
          </li>
        </ul>
      </div>
    </div>
  );
}
