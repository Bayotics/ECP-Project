"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If true, redirect to /admin/dashboard on success (unused here, kept for extensibility) */
  requireAdmin?: boolean;
}

/**
 * ProtectedRoute — wraps any page that requires the user to be logged in.
 * While auth is loading it renders a spinner; once resolved, if the user is
 * not authenticated they are redirected to /auth/login.
 */
export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }
    if (requireAdmin && !isAdmin) {
      router.replace("/member/dashboard");
    }
  }, [isLoading, isAuthenticated, isAdmin, requireAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-(--color-neutral-50)">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-(--color-green-200) border-t-(--color-green-600) animate-spin" />
          <p className="text-sm text-(--color-neutral-500)">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (requireAdmin && !isAdmin) return null;

  return <>{children}</>;
}
