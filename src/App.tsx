import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { Shell } from "@/components/layout/Shell";
import { Landing } from "@/pages/Landing";
import { Dashboard } from "@/pages/Dashboard";
import { Feed } from "@/pages/Feed";
import { Submit } from "@/pages/Submit";
import { MyRequests } from "@/pages/MyRequests";
import { Leaderboard } from "@/pages/Leaderboard";
import { Profile } from "@/pages/Profile";
import { Tools } from "@/pages/Tools";
import { AuthCallback } from "@/pages/AuthCallback";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        element={
          <ProtectedRoute>
            <Shell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/submit" element={<Submit />} />
        <Route path="/my-requests" element={<MyRequests />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/tools" element={<Tools />} />
      </Route>
    </Routes>
  );
}
