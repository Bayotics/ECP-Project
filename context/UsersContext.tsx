"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { User, CreateUserInput, UpdateUserInput } from "@/lib/models";
import { usersDB } from "@/lib/storage";

interface UsersContextValue {
  users: User[];
  isLoading: boolean;
  getById: (id: string) => User | null;
  getByEmail: (email: string) => User | null;
  getByRole: (role: User["role"]) => User[];
  add: (input: CreateUserInput) => User;
  update: (id: string, patch: UpdateUserInput) => User | null;
  remove: (id: string) => boolean;
  setRole: (id: string, role: User["role"]) => User | null;
  setStatus: (id: string, status: User["status"]) => User | null;
  refresh: () => void;
}

const UsersContext = createContext<UsersContextValue | null>(null);

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setUsers(usersDB.getAll());
    setIsLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback((input: CreateUserInput): User => {
    const created = usersDB.create(input);
    setUsers(usersDB.getAll());
    return created;
  }, []);

  const update = useCallback((id: string, patch: UpdateUserInput): User | null => {
    const updated = usersDB.update(id, patch);
    setUsers(usersDB.getAll());
    return updated;
  }, []);

  const remove = useCallback((id: string): boolean => {
    const result = usersDB.delete(id);
    setUsers(usersDB.getAll());
    return result;
  }, []);

  const setRole = useCallback((id: string, role: User["role"]): User | null => {
    const updated = usersDB.setRole(id, role);
    setUsers(usersDB.getAll());
    return updated;
  }, []);

  const setStatus = useCallback((id: string, status: User["status"]): User | null => {
    const updated = usersDB.setStatus(id, status);
    setUsers(usersDB.getAll());
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
