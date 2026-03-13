import { Newspaper, Loader2, Clock, Flame, Timer, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFeed } from "@/hooks/use-feed";
import { useCurrentWindow } from "@/hooks/use-current-window";
import { formatCountdown } from "@/lib/window-engine";
import { TweetCard } from "@/components/feed/TweetCard";
import { YourRequestCard } from "@/components/feed/YourRequestCard";
import { YourClaims } from "@/components/feed/YourClaims";
import { useAutoSettle } from "@/hooks/use-settle-window";

export function Feed() {
  const { data, isLoading, error } = useFeed();
  const { window: currentWindow, nextWindow } = useCurrentWindow();
  const navigate = useNavigate();

  // Auto-settle window during cooldown phase
  useAutoSettle();

  const phase = currentWindow?.phase ?? "between";
  const isSubmitPhase = phase === "submit";
  const isEngagePhase = phase === "engage";
  const isCooldown = phase === "cooldown";
  const isBetween = !currentWindow;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Engagement Feed</h1>
        <p className="text-muted-foreground">
          {isEngagePhase
            ? "Engage with tweets to collect credits"
            : isSubmitPhase
              ? "Preview window — engage starts soon"
              : "Waiting for the next window"}
        </p>
      </div>

      {/* Phase info bar */}
      {isSubmitPhase && currentWindow && (
        <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50/50 px-4 py-3 text-sm">
          <Clock className="h-5 w-5 shrink-0 text-primary-500" />
          <div>
            <p className="font-semibold text-primary-700">
              Submit + Preview Phase
            </p>
            <p className="text-primary-600">
              Engage phase starts in{" "}
              <span className="font-mono font-bold">
                {formatCountdown(currentWindow.timeRemainingMs)}
              </span>
              . Submit your tweet and preview what's coming!
            </p>
          </div>
        </div>
      )}

      {isEngagePhase && currentWindow && (
        <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm">
          <Flame className="h-5 w-5 shrink-0 text-orange-500" />
          <div>
            <p className="font-semibold text-orange-700">
              Engage Phase — GO!
            </p>
            <p className="text-orange-600">
              <span className="font-mono font-bold">
                {formatCountdown(currentWindow.timeRemainingMs)}
              </span>{" "}
              remaining. Engage with tweets below to collect credits!
            </p>
          </div>
        </div>
      )}

      {isCooldown && currentWindow && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <Timer className="h-5 w-5 shrink-0" />
          <p>
            Window cooldown.{" "}
            {nextWindow && (
              <>
                Next window opens in{" "}
                <span className="font-mono font-bold">
                  {formatCountdown(
                    nextWindow.startsAt.getTime() - Date.now()
                  )}
                </span>
              </>
            )}
          </p>
        </div>
      )}

      {isBetween && nextWindow && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          <Clock className="h-5 w-5 shrink-0" />
          <p>
            Next window (W{nextWindow.windowNumber}) opens in{" "}
            <span className="font-mono font-bold">
              {formatCountdown(nextWindow.startsAt.getTime() - Date.now())}
            </span>
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Failed to load feed. Please try again.
        </div>
      )}

      {/* Feed content */}
      {data && !isLoading && (
        <div className="space-y-4">
          {/* Your Claims (sticky top) */}
          <YourClaims
            engagements={data.myEngagements}
            requests={data.requests}
          />

          {/* Your Request (pinned) */}
          {data.myRequest && (
            <YourRequestCard
              request={data.myRequest}
              canTopUp={isSubmitPhase || isEngagePhase}
            />
          )}

          {/* No own request — prompt to submit */}
          {!data.myRequest && (isSubmitPhase || (isEngagePhase && currentWindow?.canSubmit)) && (
            <button
              onClick={() => navigate("/submit")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary-300 bg-primary-50/30 px-4 py-6 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
            >
              <Send className="h-5 w-5" />
              Submit your tweet for this window
            </button>
          )}

          {/* Feed requests */}
          {data.requests.length > 0 ? (
            <div className="space-y-4">
              {data.requests.map((request) => (
                <TweetCard
                  key={request.id}
                  request={request}
                  myEngagements={data.myEngagements.filter(
                    (e) => e.tweet_request_id === request.id
                  )}
                  isPreview={isSubmitPhase}
                />
              ))}
            </div>
          ) : (
            /* Empty feed */
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-muted-foreground">
              <Newspaper className="h-10 w-10 opacity-30" />
              <p className="mt-3 text-sm">
                {isSubmitPhase
                  ? "No tweets submitted yet. Be the first!"
                  : isBetween || isCooldown
                    ? "No active window right now. Check back soon!"
                    : "No tweets available. Submit yours!"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
