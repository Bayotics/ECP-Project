"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { User } from "@/lib/models";
import { apiRequest } from "@/lib/client/api";
import type { CreateUserInput } from "@/lib/models/user";

type RegisterInput = Omit<CreateUserInput, "role" | "status"> & { password: string };

interface AuthContextValue {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isMember: boolean;
  login: (userId: string) => Promise<void>;
  logout: () => void;
  refreshCurrentUser: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (input: RegisterInput) => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean }>;
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
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      if (!email || !password) return { success: false, error: "Email and password are required." };
      try {
        const user = await apiRequest<User>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setCurrentUser(user);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Invalid email or password." };
      }
    },
    []
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<{ success: boolean; error?: string }> => {
      if (!input.password || input.password.length < 6)
        return { success: false, error: "Password must be at least 6 characters." };

      try {
        const user = await apiRequest<User>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ ...input, email: input.email.trim().toLowerCase() }),
        });
        setCurrentUser(user);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Registration failed.",
        };
      }
    },
    []
  );

  const sendPasswordReset = useCallback(async (email: string): Promise<{ success: boolean }> => {
    await apiRequest<{ message: string }>("/api/auth/password-reset", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return { success: true };
  }, []);

  const isAuthenticated = currentUser !== null;
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super-admin";
  const isMember = currentUser?.role === "member" || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        currentUser, isLoading, isAuthenticated, isAdmin, isMember,
        login, logout, refreshCurrentUser,
        loginWithEmail, register, sendPasswordReset,
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
