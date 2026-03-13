import { useState } from "react";
import { Trophy, Loader2, Medal } from "lucide-react";
import { useLeaderboard, type LeaderboardPeriod } from "@/hooks/use-leaderboard";
import { useAuthStore } from "@/stores/auth-store";
import { CreatorName } from "@/components/ui/CreatorName";
import { formatCredits } from "@/lib/utils";

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];

const RANK_COLORS = [
  "text-yellow-500", // 1st
  "text-gray-400",   // 2nd
  "text-amber-600",  // 3rd
];

export function Leaderboard() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("week");
  const { data: entries, isLoading } = useLeaderboard(period);
  const currentUser = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">
          Top engagers in the community
        </p>
      </div>

      {/* Period tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              period === p.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && entries && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <Trophy className="h-10 w-10 opacity-30" />
          <p className="mt-3 text-sm">
            No engagements yet for this period. Be the first!
          </p>
        </div>
      )}

      {/* Leaderboard list */}
      {entries && entries.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          {entries.map((entry, index) => {
            const rank = index + 1;
            const isCurrentUser = entry.user_id === currentUser?.id;

            return (
              <div
                key={entry.user_id}
                className={`flex items-center gap-4 px-5 py-4 ${
                  index > 0 ? "border-t border-border" : ""
                } ${isCurrentUser ? "bg-primary-50/50" : ""}`}
              >
                {/* Rank */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                  {rank <= 3 ? (
                    <Medal
                      className={`h-6 w-6 ${RANK_COLORS[rank - 1]}`}
                    />
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground">
                      {rank}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <img
                  src={entry.x_avatar_url}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full"
                />

                {/* Name + username */}
                <div className="min-w-0 flex-1">
                  <CreatorName
                    user={{
                      x_display_name: entry.x_display_name,
                      x_username: entry.x_username,
                      is_verified: entry.is_verified,
                      tweet_score: entry.tweet_score,
                      ethos_score: entry.ethos_score,
                    }}
                    size="sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    @{entry.x_username}
                  </p>
                </div>

                {/* Stats */}
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-primary-600">
                    {formatCredits(entry.total_credits_collected)} cr
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.total_engagements} engagements
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
