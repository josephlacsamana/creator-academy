import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import type { EngagementType } from "@/types/database";

export function useClaimEngagementV2() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      tweetRequestId: string;
      engagementType: EngagementType;
    }) => {
      const { data, error } = await supabase.rpc("claim_engagement_v2", {
        p_tweet_request_id: params.tweetRequestId,
        p_engagement_type: params.engagementType,
      });

      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

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
