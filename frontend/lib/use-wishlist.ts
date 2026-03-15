"use client";

import { useCallback, useEffect, useState } from "react";
import { addToWishlist, fetchWishlist, removeFromWishlist } from "@/lib/api";
import { Product } from "@/lib/types";

const EVENT_NAME = "mietly-wishlist-change";

export function useWishlist() {
  const [productIds, setProductIds] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("user_token") || "" : "";
    if (!token) {
      setProductIds([]);
      setProducts([]);
      return;
    }

    setLoading(true);
    try {
      const payload = await fetchWishlist(token);
      setProductIds(payload.productIds || []);
      setProducts(payload.products || []);
    } catch {
      setProductIds([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onChanged = () => refresh();
    window.addEventListener(EVENT_NAME, onChanged);
    return () => window.removeEventListener(EVENT_NAME, onChanged);
  }, [refresh]);

  const toggleWishlist = useCallback(async (productId: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("user_token") || "" : "";
    if (!token) {
      throw new Error("LOGIN_REQUIRED");
    }

    const isSaved = productIds.includes(productId);
    if (isSaved) {
      const payload = await removeFromWishlist(token, productId);
      setProductIds(payload.productIds || []);
    } else {
      const payload = await addToWishlist(token, productId);
      setProductIds(payload.productIds || []);
    }

    window.dispatchEvent(new Event(EVENT_NAME));
  }, [productIds]);

  return {
    loading,
    productIds,
    products,
    isWishlisted: (productId: string) => productIds.includes(productId),
    toggleWishlist,
    refresh,
  };
}
