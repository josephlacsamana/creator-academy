import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";

export function AuthCallback() {
  const initialize = useAuthStore((s) => s.initialize);
  const navigate = useNavigate();

  useEffect(() => {
    initialize().then(() => {
      navigate("/dashboard", { replace: true });
    });
  }, [initialize, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary-400 border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">
          Connecting your X account...
        </p>
      </div>
    </div>
  );
}
