import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";

export function useTopUpRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { requestId: string; amount: number }) => {
      const { data, error } = await supabase.rpc("top_up_request", {
        p_request_id: params.requestId,
        p_amount: params.amount,
      });

      if (error) throw error;
      return data as number; // new credits_remaining
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
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
