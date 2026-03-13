import { useAuthStore } from "@/stores/auth-store";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCredits } from "@/lib/utils";
import {
  Coins,
  Shield,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  ShieldCheck,
  RefreshCw,
  Loader2,
} from "lucide-react";
import type { TransactionType } from "@/types/database";

const TX_ICONS: Record<TransactionType, typeof Coins> = {
  earn: ArrowDownLeft,
  spend: ArrowUpRight,
  bonus: Gift,
  admin_grant: ShieldCheck,
  refund: RefreshCw,
};

const TX_LABELS: Record<TransactionType, string> = {
  earn: "Collected",
  spend: "Spent",
  bonus: "Bonus",
  admin_grant: "Admin Grant",
  refund: "Refund",
};

export function Profile() {
  const user = useAuthStore((s) => s.user);
  const { data: transactions, isLoading } = useTransactions();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Your account details</p>
      </div>

      {/* Profile card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <img
            src={user.x_avatar_url}
            alt={user.x_display_name}
            className="h-16 w-16 rounded-full"
          />
          <div>
            <h2 className="text-xl font-semibold">{user.x_display_name}</h2>
            <p className="text-muted-foreground">@{user.x_username}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Coins className="h-4 w-4" />
              Credits
            </div>
            <p className="mt-1 text-2xl font-bold text-primary-600">
              {formatCredits(user.credits)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              Trust Score
            </div>
            <p className="mt-1 text-2xl font-bold">
              {(user.trust_score * 100).toFixed(0)}%
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Joined
            </div>
            <p className="mt-1 text-lg font-bold">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold">Transaction History</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !transactions?.length ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            No transactions yet. Submit a tweet or engage with others to get started.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {transactions.map((tx) => {
              const Icon = TX_ICONS[tx.type];
              const isPositive = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 py-3"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      isPositive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {tx.description || TX_LABELS[tx.type]}
                      </p>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {TX_LABELS[tx.type]}
                      </span>
                    </div>
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
