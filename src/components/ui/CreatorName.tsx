import type { User } from "@/types/database";
import { BadgeCheck } from "lucide-react";

interface CreatorNameProps {
  user: Pick<User, "x_display_name" | "x_username" | "is_verified" | "tweet_score" | "ethos_score">;
  showUsername?: boolean;
  size?: "sm" | "md";
}

export function CreatorName({ user, showUsername = false, size = "md" }: CreatorNameProps) {
  const textSize = size === "sm" ? "text-sm" : "text-base";

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className={`font-semibold truncate ${textSize}`}>
        {user.x_display_name}
      </span>

      {user.is_verified && (
        <BadgeCheck className="h-4 w-4 shrink-0 fill-blue-500 text-white" />
      )}

      {user.tweet_score != null && (
        <span className="inline-flex shrink-0 items-center rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">
          TS {user.tweet_score.toFixed(0)}
        </span>
      )}

      {user.ethos_score != null && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
          <img src="/ethos-logo.png" alt="Ethos" className="h-3 w-3 shrink-0 rounded-full" />
          {user.ethos_score.toFixed(0)}
        </span>
      )}

      {showUsername && (
        <span className="truncate text-xs text-muted-foreground">
          @{user.x_username}
        </span>
      )}
    </div>
  );
}
