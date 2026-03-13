import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import type { TweetRequest, User, Engagement } from "@/types/database";

export interface FeedTweetRequest extends TweetRequest {
  user: User;
}

export function useFeed() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["feed", user?.id],
    queryFn: async () => {
      // Get active tweet requests from OTHER users
      const { data: requests, error } = await supabase
        .from("tweet_requests")
        .select("*, user:users(*)")
        .eq("status", "active")
        .neq("user_id", user!.id)
        .gt("credits_remaining", 0)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get current user's engagements on these requests
      const requestIds = (requests ?? []).map((r: any) => r.id);
      let myEngagements: Engagement[] = [];

      if (requestIds.length > 0) {
        const { data: engagements } = await supabase
          .from("engagements")
          .select("*")
          .eq("engager_user_id", user!.id)
          .in("tweet_request_id", requestIds);

        myEngagements = (engagements ?? []) as Engagement[];
      }

      return {
        requests: (requests ?? []) as FeedTweetRequest[],
        myEngagements,
      };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}
