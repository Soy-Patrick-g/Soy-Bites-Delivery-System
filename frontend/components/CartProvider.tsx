"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CartItem } from "@/lib/types";

const STORAGE_KEY = "foodhub.cart";

type AddCartItemInput = Omit<CartItem, "quantity"> & {
  quantity?: number;
};

type CartContextValue = {
  items: CartItem[];
  isReady: boolean;
  addItem: (item: AddCartItemInput) => void;
  setQuantity: (menuItemId: number, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  getQuantity: (menuItemId: number) => number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored) as CartItem[]);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [isReady, items]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    return {
      items,
      isReady,
      addItem(item) {
        const quantity = item.quantity ?? 1;
        setItems((current) => {
          const existing = current.find((entry) => entry.menuItemId === item.menuItemId);
          if (existing) {
            return current.map((entry) =>
              entry.menuItemId === item.menuItemId
                ? { ...entry, quantity: entry.quantity + quantity }
                : entry
            );
          }

          return [
            ...current,
            {
              ...item,
              quantity
            }
          ];
        });
      },
      setQuantity(menuItemId, quantity) {
        setItems((current) => {
          if (quantity <= 0) {
            return current.filter((item) => item.menuItemId !== menuItemId);
          }
          return current.map((item) =>
            item.menuItemId === menuItemId ? { ...item, quantity } : item
          );
        });
      },
      clearCart() {
        setItems([]);
      },
      itemCount,
      subtotal,
      getQuantity(menuItemId) {
        return items.find((item) => item.menuItemId === menuItemId)?.quantity ?? 0;
      }
    };
  }, [isReady, items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
