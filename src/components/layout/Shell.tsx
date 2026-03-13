import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

export function Shell() {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile top nav */}
      <MobileNav />

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card lg:hidden">
        <MobileBottomTabs />
      </nav>
    </div>
  );
}

import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Newspaper,
  Send,
  Trophy,
  Wrench,
} from "lucide-react";

const bottomTabs = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { path: "/feed", icon: Newspaper, label: "Feed" },
  { path: "/submit", icon: Send, label: "Submit" },
  { path: "/leaderboard", icon: Trophy, label: "Rank" },
  { path: "/tools", icon: Wrench, label: "Tools" },
];

function MobileBottomTabs() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-around py-2">
      {bottomTabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
              isActive
                ? "text-primary-400 font-semibold"
                : "text-muted-foreground"
            }`}
          >
            <tab.icon className="h-5 w-5" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
