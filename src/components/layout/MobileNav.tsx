import { useAuthStore } from "@/stores/auth-store";
import { formatCredits } from "@/lib/utils";
import { Coins, Menu } from "lucide-react";
import { CreatorName } from "@/components/ui/CreatorName";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function MobileNav() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src="/logo-icon.jpg" alt="Creator Academy" className="h-8 w-8" />
          <span className="font-semibold">Creator Academy</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1">
              <Coins className="h-3.5 w-3.5 text-primary-400" />
              <span className="text-sm font-semibold text-primary-600">
                {formatCredits(user.credits)}
              </span>
            </div>
          )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Dropdown menu */}
      {menuOpen && (
        <div className="border-t border-border bg-card px-4 py-3">
          {user && (
            <div className="mb-3 flex items-center gap-3">
              <img
                src={user.x_avatar_url}
                alt=""
                className="h-8 w-8 rounded-full"
              />
              <div>
                <CreatorName user={user} size="sm" />
                <p className="text-xs text-muted-foreground">@{user.x_username}</p>
              </div>
            </div>
          )}
          <div className="space-y-1">
            {[
              { label: "My Requests", path: "/my-requests" },
              { label: "Profile", path: "/profile" },
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMenuOpen(false);
                }}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => {
                signOut();
                setMenuOpen(false);
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-destructive hover:bg-red-50"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
