import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { useDashboardStats } from "@/hooks/use-transactions";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCredits } from "@/lib/utils";
import {
  Coins,
  Send,
  Newspaper,
  Heart,
  ArrowUpRight,
  Clock,
  FileText,
  ArrowDownLeft,
  ArrowUpRight as ArrowOut,
  Gift,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import type { TransactionType } from "@/types/database";

const TX_ICONS: Record<TransactionType, typeof Heart> = {
  earn: ArrowDownLeft,
  spend: ArrowOut,
  bonus: Gift,
  admin_grant: ShieldCheck,
  refund: RefreshCw,
};

const TX_COLORS: Record<TransactionType, string> = {
  earn: "text-green-600",
  spend: "text-red-500",
  bonus: "text-primary-500",
  admin_grant: "text-blue-500",
  refund: "text-green-600",
};

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { data: stats } = useDashboardStats();
  const { data: recentTx } = useTransactions(5);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user.x_display_name.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s your engagement overview
        </p>
      </div>

      {/* Credit card */}
      <div className="rounded-2xl bg-gradient-to-br from-primary-400 to-primary-500 p-6 text-primary-foreground shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">Your Balance</p>
            <p className="mt-1 text-4xl font-bold">
              {formatCredits(user.credits)}
            </p>
            <p className="mt-1 text-sm opacity-80">credits</p>
          </div>
          <Coins className="h-12 w-12 opacity-40" />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Spent Today",
            value: stats ? formatCredits(stats.spentToday) : "—",
            icon: ArrowOut,
          },
          {
            label: "Collected Today",
            value: stats ? formatCredits(stats.collectedToday) : "—",
            icon: ArrowUpRight,
          },
          {
            label: "Pending",
            value: stats ? String(stats.pendingEngagements) : "—",
            icon: Clock,
          },
          {
            label: "Active Tweets",
            value: stats ? String(stats.activeRequests) : "—",
            icon: FileText,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <stat.icon className="h-4 w-4" />
              {stat.label}
            </div>
            <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Weekly stats */}
      {stats && (stats.spentWeekly > 0 || stats.collectedWeekly > 0) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Spent This Week</p>
            <p className="mt-1 text-xl font-semibold text-red-500">
              {formatCredits(stats.spentWeekly)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Collected This Week</p>
            <p className="mt-1 text-xl font-semibold text-green-600">
              {formatCredits(stats.collectedWeekly)}
            </p>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => navigate("/submit")}
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary-200 hover:bg-primary-50/50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
            <Send className="h-5 w-5 text-primary-400" />
          </div>
          <div>
            <p className="font-semibold">Submit a Tweet</p>
            <p className="text-sm text-muted-foreground">
              Get engagement on your post
            </p>
          </div>
        </button>
        <button
          onClick={() => navigate("/feed")}
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary-200 hover:bg-primary-50/50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
            <Newspaper className="h-5 w-5 text-primary-400" />
          </div>
          <div>
            <p className="font-semibold">Browse Feed</p>
            <p className="text-sm text-muted-foreground">
              Engage and collect credits
            </p>
          </div>
        </button>
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold">Recent Activity</h2>
        {!recentTx?.length ? (
          <div className="mt-8 flex flex-col items-center justify-center text-muted-foreground">
            <Heart className="h-8 w-8 opacity-30" />
            <p className="mt-2 text-sm">No activity yet. Start engaging!</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {recentTx.map((tx) => {
              const Icon = TX_ICONS[tx.type];
              const color = TX_COLORS[tx.type];
              const isPositive = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold ${
                      isPositive ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {formatCredits(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
