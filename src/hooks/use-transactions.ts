import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import type { Transaction } from "@/types/database";

export function useTransactions(limit?: number) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["transactions", user?.id, limit],
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });
}

export function useDashboardStats() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Credits spent today (submitted tweets)
      const { data: spentToday } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", user!.id)
        .eq("type", "spend")
        .gte("created_at", todayISO);

      // Credits collected today (engagements)
      const { data: collectedToday } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", user!.id)
        .eq("type", "earn")
        .gte("created_at", todayISO);

      // Pending engagements
      const { count: pendingCount } = await supabase
        .from("engagements")
        .select("*", { count: "exact", head: true })
        .eq("engager_user_id", user!.id)
        .eq("status", "pending");

      // Active tweet requests
      const { count: activeRequests } = await supabase
        .from("tweet_requests")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("status", "active");

      // Weekly stats
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekISO = weekAgo.toISOString();

      const { data: spentWeek } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", user!.id)
        .eq("type", "spend")
        .gte("created_at", weekISO);

      const { data: collectedWeek } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", user!.id)
        .eq("type", "earn")
        .gte("created_at", weekISO);

      const spent = spentToday?.reduce((sum, t) => sum + Math.abs(t.amount), 0) ?? 0;
      const collected = collectedToday?.reduce((sum, t) => sum + t.amount, 0) ?? 0;
      const spentWeekly = spentWeek?.reduce((sum, t) => sum + Math.abs(t.amount), 0) ?? 0;
      const collectedWeekly = collectedWeek?.reduce((sum, t) => sum + t.amount, 0) ?? 0;

      return {
        spentToday: spent,
        collectedToday: collected,
        spentWeekly,
        collectedWeekly,
        pendingEngagements: pendingCount ?? 0,
        activeRequests: activeRequests ?? 0,
      };
    },
    enabled: !!user,
  });
}
