"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Order, CreateOrderInput, UpdateOrderInput } from "@/lib/models";
import { ordersDB } from "@/lib/storage";

interface OrdersContextValue {
  orders: Order[];
  isLoading: boolean;
  getById: (id: string) => Order | null;
  getByOrderNumber: (orderNumber: string) => Order | null;
  getByUser: (userId: string) => Order[];
  getByStatus: (status: Order["status"]) => Order[];
  add: (input: CreateOrderInput) => Order;
  update: (id: string, patch: UpdateOrderInput) => Order | null;
  confirm: (id: string) => Order | null;
  ship: (id: string) => Order | null;
  deliver: (id: string) => Order | null;
  cancel: (id: string) => Order | null;
  remove: (id: string) => boolean;
  refresh: () => void;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setOrders(ordersDB.getAll());
    setIsLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback((input: CreateOrderInput): Order => {
    const created = ordersDB.create(input);
    setOrders(ordersDB.getAll());
    return created;
  }, []);

  const update = useCallback((id: string, patch: UpdateOrderInput): Order | null => {
    const updated = ordersDB.update(id, patch);
    setOrders(ordersDB.getAll());
    return updated;
  }, []);

  const confirm = useCallback((id: string): Order | null => {
    const updated = ordersDB.confirm(id);
    setOrders(ordersDB.getAll());
    return updated;
  }, []);

  const ship = useCallback((id: string): Order | null => {
    const updated = ordersDB.ship(id);
    setOrders(ordersDB.getAll());
    return updated;
  }, []);

  const deliver = useCallback((id: string): Order | null => {
    const updated = ordersDB.deliver(id);
    setOrders(ordersDB.getAll());
    return updated;
  }, []);

  const cancel = useCallback((id: string): Order | null => {
    const updated = ordersDB.cancel(id);
    setOrders(ordersDB.getAll());
    return updated;
  }, []);

  const remove = useCallback((id: string): boolean => {
    const result = ordersDB.delete(id);
    setOrders(ordersDB.getAll());
    return result;
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
