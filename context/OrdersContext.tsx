"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Order, CreateOrderInput, UpdateOrderInput } from "@/lib/models";
import { apiDelete, apiRequest } from "@/lib/client/api";

interface OrdersContextValue {
  orders: Order[];
  isLoading: boolean;
  getById: (id: string) => Order | null;
  getByOrderNumber: (orderNumber: string) => Order | null;
  getByUser: (userId: string) => Order[];
  getByStatus: (status: Order["status"]) => Order[];
  add: (input: CreateOrderInput) => Promise<Order>;
  update: (id: string, patch: UpdateOrderInput) => Promise<Order | null>;
  confirm: (id: string) => Promise<Order | null>;
  ship: (id: string) => Promise<Order | null>;
  deliver: (id: string) => Promise<Order | null>;
  cancel: (id: string) => Promise<Order | null>;
  remove: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextOrders = await apiRequest<Order[]>("/api/orders");
      setOrders(nextOrders);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadInitialOrders() {
      try {
        const nextOrders = await apiRequest<Order[]>("/api/orders");
        if (isActive) {
          setOrders(nextOrders);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialOrders();

    return () => {
      isActive = false;
    };
  }, []);

  const add = useCallback(async (input: CreateOrderInput): Promise<Order> => {
    const created = await apiRequest<Order>("/api/orders", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setOrders((prev) => [created, ...prev.filter((order) => order.id !== created.id)]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: UpdateOrderInput): Promise<Order | null> => {
    const updated = await apiRequest<Order>(`/api/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setOrders((prev) => prev.map((order) => (order.id === id ? updated : order)));
    return updated;
  }, []);

  const confirm = useCallback(async (id: string): Promise<Order | null> => {
    const updated = await apiRequest<Order>(`/api/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "confirmed", paymentStatus: "paid" }),
    });
    setOrders((prev) => prev.map((order) => (order.id === id ? updated : order)));
    return updated;
  }, []);

  const ship = useCallback(async (id: string): Promise<Order | null> => {
    const updated = await apiRequest<Order>(`/api/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "shipped" }),
    });
    setOrders((prev) => prev.map((order) => (order.id === id ? updated : order)));
    return updated;
  }, []);

  const deliver = useCallback(async (id: string): Promise<Order | null> => {
    const updated = await apiRequest<Order>(`/api/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "delivered" }),
    });
    setOrders((prev) => prev.map((order) => (order.id === id ? updated : order)));
    return updated;
  }, []);

  const cancel = useCallback(async (id: string): Promise<Order | null> => {
    const updated = await apiRequest<Order>(`/api/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "cancelled" }),
    });
    setOrders((prev) => prev.map((order) => (order.id === id ? updated : order)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    await apiDelete(`/api/orders/${id}`);
    setOrders((prev) => prev.filter((order) => order.id !== id));
    return true;
  }, []);

  const getById = useCallback((id: string) => orders.find(o => o.id === id) ?? null, [orders]);
  const getByOrderNumber = useCallback((orderNumber: string) => orders.find(o => o.orderNumber === orderNumber) ?? null, [orders]);
  const getByUser = useCallback((userId: string) => orders.filter(o => o.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [orders]);
  const getByStatus = useCallback((status: Order["status"]) => orders.filter(o => o.status === status), [orders]);

  return (
    <OrdersContext.Provider
      value={{
        orders, isLoading,
        getById, getByOrderNumber, getByUser, getByStatus,
        add, update, confirm, ship, deliver, cancel, remove, refresh,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}
