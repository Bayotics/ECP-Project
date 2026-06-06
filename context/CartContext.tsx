"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { Cart, CartItem } from "@/lib/models";
import { apiRequest } from "@/lib/client/api";
import { useAuth } from "./AuthContext";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  isLoading: boolean;
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQty: (productId: string, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  hasItem: (productId: string) => boolean;
  getQty: (productId: string) => number;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

function emptyCart(): Cart {
  return {
    id: "cart-empty",
    items: [],
    subtotal: 0,
    shippingFee: 0,
    total: 0,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

/* ─── Provider ────────────────────────────────────── */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [cart, setCart] = useState<Cart>(emptyCart());
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextCart = await apiRequest<Cart>("/api/cart");
      setCart(nextCart);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadCart() {
      try {
        const nextCart = await apiRequest<Cart>("/api/cart");
        if (isActive) {
          setCart(nextCart);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadCart();

    return () => {
      isActive = false;
    };
  }, [currentUser?.id]);

  const persistItems = useCallback(async (nextItems: CartItem[]) => {
    const nextCart = await apiRequest<Cart>("/api/cart", {
      method: "PUT",
      body: JSON.stringify({ items: nextItems }),
    });
    setCart(nextCart);
  }, []);

  const addItem = useCallback(
    async (product: Omit<CartItem, "quantity">, qty = 1) => {
      const existing = cart.items.find((item) => item.productId === product.productId);
      const nextItems = existing
        ? cart.items.map((item) =>
            item.productId === product.productId
              ? { ...item, quantity: item.quantity + qty }
              : item
          )
        : [...cart.items, { ...product, quantity: qty }];

      setCart((prev) => ({ ...prev, items: nextItems }));
      try {
        await persistItems(nextItems);
      } catch {
        await refresh();
      }
    },
    [cart.items, persistItems, refresh]
  );

  const removeItem = useCallback(async (productId: string) => {
    const nextItems = cart.items.filter((item) => item.productId !== productId);
    setCart((prev) => ({ ...prev, items: nextItems }));
    try {
      await persistItems(nextItems);
    } catch {
      await refresh();
    }
  }, [cart.items, persistItems, refresh]);

  const updateQty = useCallback(async (productId: string, qty: number) => {
    if (qty < 1) return;
    const nextItems = cart.items.map((item) =>
      item.productId === productId ? { ...item, quantity: qty } : item
    );
    setCart((prev) => ({ ...prev, items: nextItems }));
    try {
      await persistItems(nextItems);
    } catch {
      await refresh();
    }
  }, [cart.items, persistItems, refresh]);

  const clearCart = useCallback(async () => {
    setCart(emptyCart());
    try {
      const cleared = await apiRequest<Cart>("/api/cart", { method: "DELETE" });
      setCart(cleared);
    } catch {
      await refresh();
    }
  }, [refresh]);

  const hasItem = useCallback(
    (productId: string) => cart.items.some((i) => i.productId === productId),
    [cart.items]
  );

  const getQty = useCallback(
    (productId: string) =>
      cart.items.find((i) => i.productId === productId)?.quantity ?? 0,
    [cart.items]
  );

  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.subtotal;
  const shippingFee = cart.shippingFee;
  const total = cart.total;

  return (
    <CartContext.Provider
      value={{
        items: cart.items,
        itemCount,
        subtotal,
        shippingFee,
        total,
        isLoading,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        hasItem,
        getQty,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
