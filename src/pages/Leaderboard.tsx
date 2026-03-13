import { Trophy } from "lucide-react";

export function Leaderboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">Top engagers in the community</p>
      </div>

      {/* Placeholder — built in Phase 4 */}
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-muted-foreground">
        <Trophy className="h-10 w-10 opacity-30" />
        <p className="mt-3 text-sm">Leaderboard coming in Phase 4.</p>
      </div>
    </div>
  );
}
