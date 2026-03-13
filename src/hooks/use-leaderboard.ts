import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface LeaderboardEntry {
  user_id: string;
  x_username: string;
  x_display_name: string;
  x_avatar_url: string;
  is_verified: boolean;
  tweet_score: number | null;
  ethos_score: number | null;
  total_credits_collected: number;
  total_engagements: number;
}

export type LeaderboardPeriod = "week" | "month" | "all";

export function useLeaderboard(period: LeaderboardPeriod = "all") {
  return useQuery({
    queryKey: ["leaderboard", period],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_leaderboard", {
        p_period: period,
        p_limit: 50,
      });

      if (error) throw error;
      return (data ?? []) as LeaderboardEntry[];
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
