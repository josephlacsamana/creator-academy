import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import type { TweetRequest } from "@/types/database";

export function useMyRequests() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["my-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tweet_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TweetRequest[];
    },
    enabled: !!user,
  });
}

export function useSubmitTweet() {
  const queryClient = useQueryClient();
  const { setUser, user } = useAuthStore.getState();

  return useMutation({
    mutationFn: async (params: {
      tweetUrl: string;
      tweetId: string;
      wantLikes: boolean;
      wantComments: boolean;
      wantReposts: boolean;
      wantBookmarks: boolean;
      creditsDeposited: number;
    }) => {
      const { data, error } = await supabase.rpc("submit_tweet_with_escrow", {
        p_tweet_url: params.tweetUrl,
        p_tweet_id: params.tweetId,
        p_want_likes: params.wantLikes,
        p_want_comments: params.wantComments,
        p_want_reposts: params.wantReposts,
        p_want_bookmarks: params.wantBookmarks,
        p_credits_deposited: params.creditsDeposited,
      });

      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      // Update local credit balance
      if (user) {
        const freshUser = useAuthStore.getState().user;
        if (freshUser) {
          supabase
            .from("users")
            .select("credits")
            .eq("id", freshUser.id)
            .single()
            .then(({ data }) => {
              if (data) setUser({ ...freshUser, credits: data.credits });
            });
        }
      }
    },
  });
}

export function useCancelRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.rpc("cancel_tweet_request", {
        p_request_id: requestId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      // Refresh user credits
      const user = useAuthStore.getState().user;
      if (user) {
        supabase
          .from("users")
          .select("credits")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            if (data)
              useAuthStore.getState().setUser({ ...user, credits: data.credits });
          });
      }
    },
  });
}

export function useTogglePause() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase.rpc(
        "toggle_tweet_request_pause",
        { p_request_id: requestId }
      );
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
    },
  });
}
