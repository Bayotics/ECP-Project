"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { User } from "@/lib/models";
import { apiRequestEnvelope, apiRequest } from "@/lib/client/api";
import { passwordProblem } from "@/lib/models/password";


interface AuthContextValue {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isMember: boolean;
  login: (userId: string) => Promise<void>;
  logout: () => void;
  refreshCurrentUser: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string; reason?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await apiRequest<User | null>("/api/auth/session");
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadInitialUser() {
      try {
        const user = await apiRequest<User | null>("/api/auth/session");
        if (isActive) {
          setCurrentUser(user);
        }
      } catch {
        if (isActive) {
          setCurrentUser(null);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialUser();

    return () => {
      isActive = false;
    };
  }, []);

  const login = useCallback(async (userId: string) => {
    const user = await apiRequest<User>(`/api/users/${userId}`);
    setCurrentUser(user);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    void apiRequest<null>("/api/auth/logout", { method: "POST" }).catch(() => undefined);
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  const loginWithEmail = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ success: boolean; error?: string; reason?: string }> => {
      if (!email || !password) return { success: false, error: "Email and password are required." };
      try {
        /* The raw response is read rather than apiRequest's unwrapped data,
           because a refusal carries a `reason` alongside the message and the
           page offers a new confirmation link when that reason is an
           unconfirmed address. */
        const res = await fetch("/api/auth/login", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const payload = (await res.json().catch(() => null)) as
          | { ok: boolean; data?: User; error?: string; reason?: string }
          | null;

        if (!res.ok || !payload?.ok) {
          return {
            success: false,
            error: payload?.error ?? "Invalid email or password.",
            reason: payload?.reason,
          };
        }
        if (payload.data) setCurrentUser(payload.data);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Invalid email or password." };
      }
    },
    []
  );

  const sendPasswordReset = useCallback(
    async (email: string): Promise<{ success: boolean; message?: string; error?: string }> => {
      try {
        /* The envelope, not the data: this endpoint answers with a message
           and deliberately no data, because it says the same thing whether
           or not the address belongs to an account. */
        const payload = await apiRequestEnvelope<null, { message?: string }>(
          "/api/auth/password-reset",
          { method: "POST", body: JSON.stringify({ email }) },
        );
        return { success: true, message: payload.message };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Could not send the reset email.",
        };
      }
    },
    [],
  );

  const changePassword = useCallback(
    async (
      currentPassword: string,
      newPassword: string,
    ): Promise<{ success: boolean; error?: string }> => {
      const problem = passwordProblem(newPassword, { rejecting: [currentPassword] });
      if (problem) return { success: false, error: problem };

      try {
        const payload = await apiRequestEnvelope<User>("/api/auth/change-password", {
          method: "POST",
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        /* The response carries the account with `mustChangePassword` gone,
           so the prompt disappears without another round trip. */
        if (payload.data) setCurrentUser(payload.data);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Could not change your password.",
        };
      }
    },
    [],
  );

  const isAuthenticated = currentUser !== null;
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super-admin";
  const isMember = currentUser?.role === "member" || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        currentUser, isLoading, isAuthenticated, isAdmin, isMember,
        login, logout, refreshCurrentUser,
        loginWithEmail, sendPasswordReset, changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
