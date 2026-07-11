import { useEffect, useState } from "react";
import { readCart, type CartItem } from "@/lib/cart";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setHydrated(true);
    const sync = () => setItems(readCart());
    window.addEventListener("cart:changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("cart:changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const count = items.reduce((n, i) => n + i.qty, 0);
  return { items, count, hydrated };
}
