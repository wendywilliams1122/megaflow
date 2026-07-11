// Simple localStorage cart
export type CartItem = {
  productId: string;
  title: string;
  slug: string;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  qty: number;
};

const KEY = "mf_cart_v1";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("cart:changed"));
}

export function addToCart(item: Omit<CartItem, "qty">, qty = 1) {
  const items = readCart();
  const existing = items.find((i) => i.productId === item.productId);
  if (existing) {
    existing.qty += qty;
  } else {
    items.push({ ...item, qty });
  }
  writeCart(items);
}

export function removeFromCart(productId: string) {
  writeCart(readCart().filter((i) => i.productId !== productId));
}

export function updateQty(productId: string, qty: number) {
  if (qty <= 0) return removeFromCart(productId);
  const items = readCart().map((i) =>
    i.productId === productId ? { ...i, qty } : i,
  );
  writeCart(items);
}

export function clearCart() {
  writeCart([]);
}

export function cartTotalCents(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.priceCents * i.qty, 0);
}
