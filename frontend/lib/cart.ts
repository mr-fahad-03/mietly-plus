"use client";

import { CartItem } from "@/lib/types";

const CART_STORAGE_KEY = "mietly_cart";
const CART_CHANGE_EVENT = "mietly-cart-change";

function readCartUnsafe(): CartItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCartUnsafe(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CART_CHANGE_EVENT));
}

export function getCartItems() {
  return readCartUnsafe();
}

export function getCartCount() {
  return readCartUnsafe().reduce((sum, item) => sum + Math.max(1, item.quantity || 1), 0);
}

export function addCartItem(item: Omit<CartItem, "id" | "addedAt">) {
  const items = readCartUnsafe();
  const existingIndex = items.findIndex(
    (entry) =>
      entry.productId === item.productId &&
      entry.durationValue === item.durationValue &&
      entry.durationUnit === item.durationUnit &&
      entry.startDate === item.startDate
  );

  if (existingIndex >= 0) {
    items[existingIndex] = {
      ...items[existingIndex],
      ...item,
      quantity: items[existingIndex].quantity + Math.max(1, item.quantity || 1),
    };
  } else {
    items.push({
      ...item,
      id: `${item.productId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      addedAt: new Date().toISOString(),
    });
  }

  writeCartUnsafe(items);
}

export function removeCartItem(itemId: string) {
  const items = readCartUnsafe().filter((item) => item.id !== itemId);
  writeCartUnsafe(items);
}

export function updateCartItemQuantity(itemId: string, quantity: number) {
  const nextQty = Math.max(1, Math.floor(quantity));
  const items = readCartUnsafe().map((item) => (item.id === itemId ? { ...item, quantity: nextQty } : item));
  writeCartUnsafe(items);
}

export function clearCart() {
  writeCartUnsafe([]);
}

export function subscribeCartChange(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(CART_CHANGE_EVENT, handler);
  return () => window.removeEventListener(CART_CHANGE_EVENT, handler);
}
