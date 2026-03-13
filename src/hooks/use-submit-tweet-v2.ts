import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import type { SubmitMode } from "@/types/database";

interface SubmitTweetV2Params {
  tweetUrl: string;
  tweetId: string;
  windowId: string;
  likesGoal: number;
  commentsGoal: number;
  repostsGoal: number;
  bookmarksGoal: number;
  creditsDeposited: number;
  submitMode: SubmitMode;
}

export function useSubmitTweetV2() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SubmitTweetV2Params) => {
      const { data, error } = await supabase.rpc("submit_tweet_v2", {
        p_tweet_url: params.tweetUrl,
        p_tweet_id: params.tweetId,
        p_window_id: params.windowId,
        p_likes_goal: params.likesGoal,
        p_comments_goal: params.commentsGoal,
        p_reposts_goal: params.repostsGoal,
        p_bookmarks_goal: params.bookmarksGoal,
        p_credits_deposited: params.creditsDeposited,
        p_submit_mode: params.submitMode,
      });

      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });

      // Refresh user credits in auth store
      const user = useAuthStore.getState().user;
      if (user) {
        supabase
          .from("users")
          .select("credits")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              useAuthStore
                .getState()
                .setUser({ ...useAuthStore.getState().user!, credits: data.credits });
            }
          });
      }
    },
  });
}
