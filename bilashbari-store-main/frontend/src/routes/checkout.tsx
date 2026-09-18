import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cart, useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Check, Lock, Truck } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  component: Checkout,
  head: () => ({ meta: [{ title: "Checkout — Bilashbari" }] }),
});

const methods = [
  { id: "COD", label: "Cash on Delivery", disabled: false },
  { id: "Bkash", label: "Bkash", disabled: true },
  { id: "Nagad", label: "Nagad", disabled: true },
  { id: "Rocket", label: "Rocket", disabled: true },
];

const areas = [
  { id: "inside", label: "Inside Dhaka", charge: 80 },
  { id: "outside", label: "Outside Dhaka", charge: 150 },
] as const;

const PHONE_RE = /^\+8801\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Checkout() {
  const items = useCart();
  const user = useAuth();
  const navigate = useNavigate();
  const [method, setMethod] = useState("COD");
  const [area, setArea] = useState<"inside" | "outside">("inside");
  const [form, setForm] = useState({ name: "", email: "", address: "", phone: "+880" });
  const [submitting, setSubmitting] = useState(false);
  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
  const deliveryCharge = areas.find((a) => a.id === area)!.charge;
  const total = subtotal + deliveryCharge;

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, name: user.name, email: user.email }));
  }, [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in first");
      navigate({ to: "/login" });
      return;
    }
    if (items.length === 0) return;
    if (method !== "COD") {
      toast.error("This payment method is coming soon");
      return;
    }
    if (!EMAIL_RE.test(form.email)) {
      toast.error("Invalid email address");
      return;
    }
    if (!PHONE_RE.test(form.phone)) {
      toast.error("Invalid phone. Use +8801XXXXXXXXX (11 digits after +880 1)");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api<{ id: number }>("/orders", {
        method: "POST",
        body: JSON.stringify({
          items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
          billing: { ...form, method, delivery_area: area },
        }),
      });
      cart.clear();
      toast.success(`Order #${res.id} placed!`);
      navigate({ to: "/orders" });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl">Your cart is empty</h1>
        <Link
          to="/products"
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-4xl">Checkout</h1>
      <form onSubmit={submit} noValidate className="mt-8 grid gap-8 md:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="font-display text-xl">Billing details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">Full name</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-11 w-full rounded-lg border bg-background px-3"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">Email</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                  title="Enter a valid email like name@example.com"
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-lg border bg-background px-3"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">Phone</span>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  pattern="\+8801[0-9]{9}"
                  title="Bangladesh phone format: +8801XXXXXXXXX"
                  placeholder="+8801XXXXXXXXX"
                  maxLength={14}
                  className="h-11 w-full rounded-lg border bg-background px-3"
                />
                <span className="mt-1 block text-xs text-muted-foreground">
                  Format: +880 followed by an 11-digit BD mobile number
                </span>
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block text-muted-foreground">Delivery address</span>
                <textarea
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="min-h-24 w-full rounded-lg border bg-background p-3"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6">
            <h2 className="flex items-center gap-2 font-display text-xl">
              <Truck className="h-5 w-5 text-primary" /> Delivery area
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Inside Dhaka: ৳80 • Outside Dhaka: ৳150
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {areas.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => setArea(a.id)}
                  className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
                    area === a.id
                      ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                      : "hover:bg-muted"
                  }`}
                >
                  <div>
                    <div className="font-medium">{a.label}</div>
                    <div className="text-xs text-muted-foreground">Delivery charge ৳{a.charge}</div>
                  </div>
                  {area === a.id && <Check className="h-5 w-5 text-primary" />}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6">
            <h2 className="font-display text-xl">Payment method</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {methods.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  disabled={m.disabled}
                  onClick={() => !m.disabled && setMethod(m.id)}
                  className={`flex items-center justify-between rounded-xl border p-4 text-left transition
                    ${method === m.id ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "hover:bg-muted"}
                    ${m.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div>
                    <div className="font-medium">{m.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.disabled ? "Coming Soon" : "Pay when you receive your order"}
                    </div>
                  </div>
                  {method === m.id && !m.disabled && <Check className="h-5 w-5 text-primary" />}
                  {m.disabled && <Lock className="h-4 w-4 text-muted-foreground" />}
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border bg-card p-6">
          <h2 className="font-display text-xl">Order summary</h2>
          <ul className="mt-4 space-y-3">
            {items.map((i) => (
              <li key={i.product_id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {i.name} × {i.quantity}
                </span>
                <span>৳{i.price * i.quantity}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>৳{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Delivery ({area === "inside" ? "Inside Dhaka" : "Outside Dhaka"})
              </span>
              <span>৳{deliveryCharge}</span>
            </div>
          </div>
          <div className="mt-3 flex justify-between border-t pt-3 text-base font-semibold">
            <span>Total</span>
            <span>৳{total}</span>
          </div>
          <button
            disabled={submitting}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {submitting ? "Placing order…" : "Place order"}
          </button>
        </aside>
      </form>
    </div>
  );
}
