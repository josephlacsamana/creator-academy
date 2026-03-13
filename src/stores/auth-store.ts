import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { fetchEthosScore } from "@/lib/ethos";
import type { User } from "@/types/database";

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signInWithTwitter: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),

  signInWithTwitter: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Check if profile already exists
        const { data: profile, error: fetchError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (fetchError) {
          console.log("[auth] Profile fetch:", fetchError.message);
        }

        if (profile) {
          set({ user: profile, loading: false });

          // Refresh Ethos score if missing or stale (>24h)
          const staleMs = 24 * 60 * 60 * 1000;
          const isStale = !profile.scores_updated_at ||
            Date.now() - new Date(profile.scores_updated_at).getTime() > staleMs;

          if (profile.ethos_score == null || isStale) {
            fetchEthosScore(profile.x_username).then(async (ethosScore) => {
              if (ethosScore != null) {
                console.log("[auth] Ethos score refreshed:", ethosScore);
                const { data: updated } = await supabase
                  .from("users")
                  .update({ ethos_score: ethosScore, scores_updated_at: new Date().toISOString() })
                  .eq("id", profile.id)
                  .select()
                  .single();
                if (updated) set({ user: updated });
              }
            });
          }

          return;
        }

        // First login — create profile from X OAuth data
        const meta = session.user.user_metadata;
        console.log("[auth] User metadata:", JSON.stringify(meta, null, 2));

        const newUser: Omit<User, "created_at" | "updated_at"> = {
          id: session.user.id,
          x_user_id: meta.provider_id ?? meta.sub ?? "",
          x_username: meta.user_name ?? meta.preferred_username ?? meta.screen_name ?? "",
          x_display_name: meta.full_name ?? meta.name ?? "",
          x_avatar_url: meta.avatar_url ?? meta.picture ?? "",
          credits: 500,
          role: "member",
          trust_score: 1.0,
          is_banned: false,
          tweet_score: null,
          ethos_score: null,
          is_verified: meta.verified ?? meta.is_blue_verified ?? false,
          scores_updated_at: null,
        };

        console.log("[auth] Creating user:", JSON.stringify(newUser, null, 2));

        const { data: created, error: createError } = await supabase
          .from("users")
          .upsert(newUser)
          .select()
          .single();

        if (createError) {
          console.error("[auth] Profile create error:", createError);
        }

        set({ user: created, loading: false });

        // Fetch Ethos score in background (don't block auth)
        if (created) {
          fetchEthosScore(created.x_username).then(async (ethosScore) => {
            if (ethosScore != null) {
              console.log("[auth] Ethos score:", ethosScore);
              const { data: updated } = await supabase
                .from("users")
                .update({ ethos_score: ethosScore, scores_updated_at: new Date().toISOString() })
                .eq("id", created.id)
                .select()
                .single();
              if (updated) set({ user: updated });
            }
          });
        }
      } else {
        console.log("[auth] No session found");
        set({ loading: false });
      }
    } catch (err) {
      console.error("[auth] Initialize error:", err);
      set({ loading: false });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        set({ user: null });
      } else if (session?.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) set({ user: profile });
      }
    });
  },
}));
