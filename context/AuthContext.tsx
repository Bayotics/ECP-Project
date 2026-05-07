"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { User } from "@/lib/models";
import { usersDB } from "@/lib/storage";
import { storageReadOne, storageWriteOne, storageRemoveKey } from "@/lib/storage/storage";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import type { CreateUserInput } from "@/lib/models/user";

type RegisterInput = Omit<CreateUserInput, "role" | "status"> & { password: string };

interface AuthContextValue {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isMember: boolean;
  login: (userId: string) => void;
  logout: () => void;
  refreshCurrentUser: () => void;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (input: RegisterInput) => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(() => {
    const userId = storageReadOne<string>(STORAGE_KEYS.AUTH_USER_ID);
    if (userId) {
      const user = usersDB.getById(userId);
      setCurrentUser(user ?? null);
    } else {
      setCurrentUser(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback((userId: string) => {
    storageWriteOne(STORAGE_KEYS.AUTH_USER_ID, userId);
    const user = usersDB.getById(userId);
    if (user) {
      usersDB.update(userId, { lastLoginAt: new Date().toISOString() });
      setCurrentUser({ ...user, lastLoginAt: new Date().toISOString() });
    }
  }, []);

  const logout = useCallback(() => {
    storageRemoveKey(STORAGE_KEYS.AUTH_USER_ID);
    setCurrentUser(null);
  }, []);

  const refreshCurrentUser = useCallback(() => {
    loadUser();
  }, [loadUser]);

  const loginWithEmail = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      if (!email || !password) return { success: false, error: "Email and password are required." };
      const user = usersDB.findByCredentials(email.trim().toLowerCase(), password);
      if (!user) return { success: false, error: "Invalid email or password." };
      if (user.status === "suspended") return { success: false, error: "This account has been suspended." };
      login(user.id);
      return { success: true };
    },
    [login]
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<{ success: boolean; error?: string }> => {
      const existing = usersDB.getByEmail(input.email.trim().toLowerCase());
      if (existing) return { success: false, error: "An account with this email already exists." };
      if (!input.password || input.password.length < 6)
        return { success: false, error: "Password must be at least 6 characters." };
      const user = usersDB.registerUser({ ...input, email: input.email.trim().toLowerCase() });
      login(user.id);
      return { success: true };
    },
    [login]
  );

  const sendPasswordReset = useCallback(async (email: string): Promise<{ success: boolean }> => {
    // Mock: always reports success regardless of whether account exists (security best practice)
    void usersDB.getByEmail(email); // no-op lookup so tree shaking keeps it
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
