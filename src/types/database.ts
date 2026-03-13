export type UserRole = "member" | "admin";

export type TweetRequestStatus =
  | "active"
  | "paused"
  | "cooldown"
  | "completed"
  | "cancelled";

export type EngagementType = "like" | "comment" | "repost" | "bookmark";

export type EngagementStatus = "pending" | "verified" | "failed" | "expired";

export type TransactionType =
  | "earn"
  | "spend"
  | "bonus"
  | "admin_grant"
  | "refund";

export interface User {
  id: string;
  x_user_id: string;
  x_username: string;
  x_display_name: string;
  x_avatar_url: string;
  credits: number;
  role: UserRole;
  trust_score: number;
  is_banned: boolean;
  tweet_score: number | null;
  ethos_score: number | null;
  is_verified: boolean;
  scores_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export type SubmitMode = "goal" | "credit";

export interface TweetRequest {
  id: string;
  user_id: string;
  tweet_url: string;
  tweet_id: string;
  want_likes: boolean;
  want_comments: boolean;
  want_reposts: boolean;
  want_bookmarks: boolean;
  credits_deposited: number;
  credits_remaining: number;
  status: TweetRequestStatus;
  cooldown_until: string | null;
  created_at: string;
  user?: User;
  // Window system fields (Phase 5+)
  window_id: string | null;
  likes_goal: number;
  comments_goal: number;
  reposts_goal: number;
  bookmarks_goal: number;
  likes_fulfilled: number;
  comments_fulfilled: number;
  reposts_fulfilled: number;
  bookmarks_fulfilled: number;
  submit_mode: SubmitMode;
}

export interface Engagement {
  id: string;
  tweet_request_id: string;
  engager_user_id: string;
  engagement_type: EngagementType;
  status: EngagementStatus;
  credits_earned: number;
  verified_at: string | null;
  claimed_at: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  reference_id: string | null;
  description: string;
  created_at: string;
}

export type WindowPhase = "submit" | "engage" | "cooldown" | "between";

export interface WindowInfo {
  windowNumber: number; // 1-5
  windowId: string; // "2026-03-13_W1"
  phase: WindowPhase;
  phaseLabel: string; // "Submit + Preview", "Engage", "Cooldown", "Between Windows"
  phaseEndsAt: Date;
  windowStartsAt: Date;
  windowEndsAt: Date;
  canSubmit: boolean;
  canClaim: boolean;
  timeRemainingMs: number;
  nextWindowStartsAt: Date | null;
}

export interface CreditSupply {
  id: number;
  total_supply: number;
  circulating: number;
  locked: number;
  updated_at: string;
}

// Supabase generated types placeholder
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, "created_at" | "updated_at">;
        Update: Partial<Omit<User, "id" | "created_at">>;
      };
      tweet_requests: {
        Row: TweetRequest;
        Insert: Omit<TweetRequest, "id" | "created_at">;
        Update: Partial<Omit<TweetRequest, "id" | "created_at">>;
      };
      engagements: {
        Row: Engagement;
        Insert: Omit<Engagement, "id" | "created_at">;
        Update: Partial<Omit<Engagement, "id" | "created_at">>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, "id" | "created_at">;
        Update: Partial<Omit<Transaction, "id" | "created_at">>;
      };
      credit_supply: {
        Row: CreditSupply;
        Insert: Omit<CreditSupply, "updated_at">;
        Update: Partial<Omit<CreditSupply, "id">>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      submit_tweet_with_escrow: {
        Args: {
          p_tweet_url: string;
          p_tweet_id: string;
          p_want_likes: boolean;
          p_want_comments: boolean;
          p_want_reposts: boolean;
          p_want_bookmarks: boolean;
          p_credits_deposited: number;
        };
        Returns: string;
      };
      cancel_tweet_request: {
        Args: { p_request_id: string };
        Returns: void;
      };
      toggle_tweet_request_pause: {
        Args: { p_request_id: string };
        Returns: string;
      };
      claim_engagement: {
        Args: {
          p_tweet_request_id: string;
          p_engagement_type: string;
        };
        Returns: string;
      };
      submit_tweet_v2: {
        Args: {
          p_tweet_url: string;
          p_tweet_id: string;
          p_window_id: string;
          p_likes_goal: number;
          p_comments_goal: number;
          p_reposts_goal: number;
          p_bookmarks_goal: number;
          p_credits_deposited: number;
          p_submit_mode: string;
        };
        Returns: string;
      };
      claim_engagement_v2: {
        Args: {
          p_tweet_request_id: string;
          p_engagement_type: string;
        };
        Returns: string;
      };
      top_up_request: {
        Args: {
          p_request_id: string;
          p_amount: number;
        };
        Returns: number;
      };
      settle_window: {
        Args: {
          p_window_id: string;
        };
        Returns: number;
      };
      get_leaderboard: {
        Args: {
          p_period: string;
          p_limit: number;
        };
        Returns: {
          user_id: string;
          x_username: string;
          x_display_name: string;
          x_avatar_url: string;
          is_verified: boolean;
          tweet_score: number | null;
          ethos_score: number | null;
          total_credits_collected: number;
          total_engagements: number;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      tweet_request_status: TweetRequestStatus;
      engagement_type: EngagementType;
      engagement_status: EngagementStatus;
      transaction_type: TransactionType;
    };
  };
}
