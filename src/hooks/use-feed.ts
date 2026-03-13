import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import { useCurrentWindow } from "@/hooks/use-current-window";
import type { TweetRequest, User, Engagement } from "@/types/database";

export interface FeedTweetRequest extends TweetRequest {
  user: User;
}

/**
 * Window-aware feed hook.
 * - Fetches active requests for the current window (sorted by credits_remaining DESC)
 * - Fetches the current user's own request in this window
 * - Fetches the user's engagements on feed requests
 * - Polls every 10s during engage phase, 30s otherwise
 */
export function useFeed() {
  const user = useAuthStore((s) => s.user);
  const { window: currentWindow } = useCurrentWindow();
  const windowId = currentWindow?.windowId ?? null;
  const isEngagePhase = currentWindow?.phase === "engage";

  return useQuery({
    queryKey: ["feed", user?.id, windowId],
    queryFn: async () => {
      if (!windowId) {
        return { requests: [], myRequest: null, myEngagements: [] };
      }

      // 1. Fetch active requests in this window from OTHER users, sorted by credits
      const { data: requests, error } = await supabase
        .from("tweet_requests")
        .select("*, user:users(*)")
        .eq("window_id", windowId)
        .eq("status", "active")
        .neq("user_id", user!.id)
        .gt("credits_remaining", 0)
        .order("credits_remaining", { ascending: false });

      if (error) throw error;

      // 2. Fetch current user's own request in this window (if any)
      const { data: myRequestData } = await supabase
        .from("tweet_requests")
        .select("*, user:users(*)")
        .eq("window_id", windowId)
        .eq("user_id", user!.id)
        .neq("status", "cancelled")
        .limit(1)
        .single();

      const myRequest = myRequestData as FeedTweetRequest | null;

      // 3. Fetch current user's engagements on feed requests
      const allRequestIds = (requests ?? []).map((r: any) => r.id);
      let myEngagements: Engagement[] = [];

      if (allRequestIds.length > 0) {
        const { data: engagements } = await supabase
          .from("engagements")
          .select("*")
          .eq("engager_user_id", user!.id)
          .in("tweet_request_id", allRequestIds);

        myEngagements = (engagements ?? []) as Engagement[];
      }

      return {
        requests: (requests ?? []) as FeedTweetRequest[],
        myRequest,
        myEngagements,
      };
    },
    enabled: !!user && !!windowId,
    refetchInterval: isEngagePhase ? 10000 : 30000,
  });
}
