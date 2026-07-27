"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { User, CreateUserInput, UpdateUserInput } from "@/lib/models";
import { apiDelete, apiRequest } from "@/lib/client/api";
import { useAuth } from "./AuthContext";

type CreateUserPayload = CreateUserInput & { password?: string };

interface UsersContextValue {
  users: User[];
  isLoading: boolean;
  getById: (id: string) => User | null;
  getByEmail: (email: string) => User | null;
  getByRole: (role: User["role"]) => User[];
  add: (input: CreateUserPayload) => Promise<User>;
  update: (id: string, patch: UpdateUserInput) => Promise<User | null>;
  remove: (id: string) => Promise<boolean>;
  setRole: (id: string, role: User["role"]) => Promise<User | null>;
  setStatus: (id: string, status: User["status"]) => Promise<User | null>;
  refresh: () => Promise<void>;
}

const UsersContext = createContext<UsersContextValue | null>(null);

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextUsers = await apiRequest<User[]>("/api/users");
      setUsers(nextUsers);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    // Private data — only fetch for signed-in members; clear on sign-out.
    if (!currentUser) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    async function loadInitialUsers() {
      try {
        const nextUsers = await apiRequest<User[]>("/api/users");
        if (isActive) {
          setUsers(nextUsers);
        }
      } catch {
        // Silent: endpoint is auth-gated; nothing to surface publicly.
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialUsers();

    return () => {
      isActive = false;
    };
  }, [currentUser?.id]);

  const add = useCallback(async (input: CreateUserPayload): Promise<User> => {
    const created = await apiRequest<User>("/api/users", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setUsers((prev) => [created, ...prev.filter((user) => user.id !== created.id)]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: UpdateUserInput): Promise<User | null> => {
    const updated = await apiRequest<User>(`/api/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setUsers((prev) => prev.map((user) => (user.id === id ? updated : user)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    await apiDelete(`/api/users/${id}`);
    setUsers((prev) => prev.filter((user) => user.id !== id));
    return true;
  }, []);

  const setRole = useCallback(async (id: string, role: User["role"]): Promise<User | null> => {
    const updated = await apiRequest<User>(`/api/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
    setUsers((prev) => prev.map((user) => (user.id === id ? updated : user)));
    return updated;
  }, []);

  const setStatus = useCallback(async (id: string, status: User["status"]): Promise<User | null> => {
    const updated = await apiRequest<User>(`/api/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setUsers((prev) => prev.map((user) => (user.id === id ? updated : user)));
    return updated;
  }, []);

  const getById = useCallback((id: string) => users.find(u => u.id === id) ?? null, [users]);
  const getByEmail = useCallback((email: string) => users.find(u => u.email === email) ?? null, [users]);
  const getByRole = useCallback((role: User["role"]) => users.filter(u => u.role === role), [users]);

  return (
    <UsersContext.Provider
      value={{
        users, isLoading,
        getById, getByEmail, getByRole,
        add, update, remove, setRole, setStatus, refresh,
      }}
    >
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers(): UsersContextValue {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsers must be used within UsersProvider");
  return ctx;
}
