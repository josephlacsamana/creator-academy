import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { cn, formatCredits } from "@/lib/utils";
import {
  LayoutDashboard,
  Newspaper,
  Send,
  ListChecks,
  Trophy,
  User,
  Wrench,
  LogOut,
  Coins,
} from "lucide-react";
import { CreatorName } from "@/components/ui/CreatorName";

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/feed", icon: Newspaper, label: "Engagement Feed" },
  { path: "/submit", icon: Send, label: "Submit Tweet" },
  { path: "/my-requests", icon: ListChecks, label: "My Requests" },
  { path: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { path: "/tools", icon: Wrench, label: "Tools" },
  { path: "/profile", icon: User, label: "Profile" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-card lg:flex lg:flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <img src="/logo-icon.jpg" alt="Creator Academy" className="h-9 w-9" />
        <span className="text-lg font-semibold">Creator Academy</span>
      </div>

      {/* Credit balance */}
      {user && (
        <div className="mx-4 mt-4 rounded-xl bg-primary-50 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Coins className="h-4 w-4 text-primary-400" />
            <span>Credits</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-primary-600">
            {formatCredits(user.credits)}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="mt-4 flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-600"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User profile + logout */}
      {user && (
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <img
              src={user.x_avatar_url}
              alt={user.x_display_name}
              className="h-9 w-9 rounded-full"
            />
            <div className="min-w-0 flex-1">
              <CreatorName user={user} size="sm" />
              <p className="truncate text-xs text-muted-foreground">
                @{user.x_username}
              </p>
            </div>
            <button
              onClick={signOut}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
