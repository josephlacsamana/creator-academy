import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import { useCurrentWindow } from "@/hooks/use-current-window";

/**
 * Hook that calls settle_window RPC during cooldown phase.
 * Auto-triggers once per window when cooldown begins.
 * Returns the number of settled requests.
 */
export function useSettleWindow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (windowId: string) => {
      const { data, error } = await supabase.rpc("settle_window", {
        p_window_id: windowId,
      });

      if (error) throw error;
      return data as number; // settled count
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

/**
 * Auto-settle hook: triggers settlement once when cooldown phase starts.
 * Place this in the Feed page component.
 */
export function useAutoSettle() {
  const { window: currentWindow } = useCurrentWindow();
  const settleMutation = useSettleWindow();
  const settledWindowRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentWindow) return;
    if (currentWindow.phase !== "cooldown") return;

    const windowId = currentWindow.windowId;

    // Only settle once per window
    if (settledWindowRef.current === windowId) return;
    if (settleMutation.isPending) return;

    settledWindowRef.current = windowId;
    settleMutation.mutate(windowId);
  }, [currentWindow, settleMutation]);
}
