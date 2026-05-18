import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

/**
 * /login — Redirects to Manus OAuth.
 * After login, returns to /admin/press-releases (or ?returnTo= param).
 * If already logged in, redirects immediately.
 */
export default function Login() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  // Parse optional returnTo from query string
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get("returnTo") || "/admin/press-releases";

  useEffect(() => {
    if (loading) return;

    if (user) {
      // Already authenticated — go straight to destination
      navigate(returnTo, { replace: true });
      return;
    }

    // Store returnTo so we can redirect after OAuth callback
    sessionStorage.setItem("loginReturnTo", returnTo);
    // Not authenticated — redirect to OAuth
    window.location.href = getLoginUrl();
  }, [user, loading, navigate, returnTo]);

  return (
    <div className="min-h-screen bg-[#0D0F14] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-gray-400 text-sm font-mono">
          {loading ? "Checking session..." : "Redirecting to login..."}
        </p>
      </div>
    </div>
  );
}
