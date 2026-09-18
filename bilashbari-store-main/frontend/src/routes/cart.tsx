import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { cart, useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  component: CartPage,
  head: () => ({ meta: [{ title: "Your cart — Bilashbari" }] }),
});

function CartPage() {
  const items = useCart();
  const total = items.reduce((n, i) => n + i.price * i.quantity, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-4xl">Your cart</h1>
      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Link
            to="/products"
            className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
          <ul className="space-y-3">
            {items.map((i) => (
              <li key={i.product_id} className="flex items-center gap-4 rounded-2xl border bg-card p-3">
                <img src={i.image_url} alt={i.name} className="h-20 w-20 rounded-lg object-cover" />
                <div className="flex-1">
                  <div className="font-medium">{i.name}</div>
                  <div className="text-sm text-muted-foreground">৳{i.price}</div>
                </div>
                <div className="flex items-center gap-1 rounded-full border">
                  <button
                    onClick={() => cart.update(i.product_id, i.quantity - 1)}
                    className="p-2 hover:bg-muted rounded-l-full"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm">{i.quantity}</span>
                  <button
                    onClick={() => cart.update(i.product_id, i.quantity + 1)}
                    className="p-2 hover:bg-muted rounded-r-full"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => cart.remove(i.product_id)}
                  className="p-2 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          <aside className="h-fit rounded-2xl border bg-card p-5">
            <h2 className="font-display text-xl">Summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>৳{total}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span>Calculated at checkout</span></div>
              <div className="mt-3 flex justify-between border-t pt-3 text-base font-semibold">
                <span>Total</span><span>৳{total}</span>
              </div>
            </div>
            <Link
              to="/checkout"
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Proceed to checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
