import { useEffect, useState } from "react";

export type CartItem = {
  product_id: number;
  name: string;
  price: number;
  image_url?: string;
  quantity: number;
};

const KEY = "bb_cart";
const EVT = "bb_cart_change";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}
function write(items: CartItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVT));
}

export const cart = {
  get: read,
  add(item: Omit<CartItem, "quantity">, qty = 1) {
    const items = read();
    const ex = items.find((i) => i.product_id === item.product_id);
    if (ex) ex.quantity += qty;
    else items.push({ ...item, quantity: qty });
    write(items);
  },
  update(product_id: number, quantity: number) {
    const items = read()
      .map((i) => (i.product_id === product_id ? { ...i, quantity } : i))
      .filter((i) => i.quantity > 0);
    write(items);
  },
  remove(product_id: number) {
    write(read().filter((i) => i.product_id !== product_id));
  },
  clear() {
    write([]);
  },
};

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    setItems(read());
    const h = () => setItems(read());
    window.addEventListener(EVT, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(EVT, h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return items;
}
