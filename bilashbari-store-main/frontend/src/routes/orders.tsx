import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ChevronDown, ChevronUp, Package } from "lucide-react";

export const Route = createFileRoute("/orders")({
  component: MyOrders,
  head: () => ({ meta: [{ title: "My Orders — Bilashbari" }] }),
});

type Order = {
  id: number;
  total_price: number;
  status: string;
  created_at: string;
};

type OrderDetail = {
  order: Order;
  items: {
    id: number;
    product_id: number;
    name: string;
    image_url?: string;
    quantity: number;
    price: number;
  }[];
  payment: {
    method: string;
    name: string;
    address: string;
    phone: string;
  } | null;
};

const statusColor: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800",
  Paid: "bg-blue-100 text-blue-800",
  Shipped: "bg-indigo-100 text-indigo-800",
  Delivered: "bg-emerald-100 text-emerald-800",
  Cancelled: "bg-rose-100 text-rose-800",
};

function MyOrders() {
  const user = useAuth();
  const nav = useNavigate();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, OrderDetail>>({});

  useEffect(() => {
    if (user === null) return;
    api<Order[]>("/orders/mine")
      .then(setOrders)
      .catch((e) => toast.error(e.message));
  }, [user]);

  useEffect(() => {
    const t = window.localStorage.getItem("bb_token");
    if (!t) nav({ to: "/login" });
  }, [nav]);

  async function toggle(id: number) {
    if (openId === id) return setOpenId(null);
    setOpenId(id);
    if (!details[id]) {
      try {
        const d = await api<OrderDetail>(`/orders/mine/${id}`);
        setDetails((prev) => ({ ...prev, [id]: d }));
      } catch (e: any) {
        toast.error(e.message);
      }
    }
  }

  async function cancel(id: number) {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      await api(`/orders/mine/${id}/cancel`, { method: "PUT" });
      toast.success("Order cancelled");
      setOrders((prev) =>
        prev ? prev.map((o) => (o.id === id ? { ...o, status: "Cancelled" } : o)) : prev,
      );
      setDetails((prev) =>
        prev[id]
          ? { ...prev, [id]: { ...prev[id], order: { ...prev[id].order, status: "Cancelled" } } }
          : prev,
      );
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center gap-3">
        <Package className="h-7 w-7 text-primary" />
        <h1 className="font-display text-4xl">My Orders</h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Track the status and details of every order you've placed.
      </p>

      {orders === null && (
        <p className="mt-10 text-sm text-muted-foreground">Loading…</p>
      )}

      {orders && orders.length === 0 && (
        <div className="mt-16 rounded-2xl border bg-card p-10 text-center">
          <p className="text-muted-foreground">You haven't placed any orders yet.</p>
          <Link
            to="/products"
            className="mt-6 inline-flex rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground"
          >
            Start shopping
          </Link>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {orders?.map((o) => {
          const open = openId === o.id;
          const d = details[o.id];
          return (
            <div key={o.id} className="overflow-hidden rounded-2xl border bg-card">
              <button
                onClick={() => toggle(o.id)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-muted/40"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-lg">Order #{o.id}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColor[o.status] || "bg-muted text-foreground"
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Placed on {new Date(o.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-base font-semibold">৳{Number(o.total_price)}</span>
                  {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </button>

              {open && (
                <div className="border-t bg-background/60 p-5">
                  {!d ? (
                    <p className="text-sm text-muted-foreground">Loading details…</p>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-[1fr_260px]">
                      <div>
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Items ({d.items.reduce((n, i) => n + i.quantity, 0)})
                        </h3>
                        <ul className="space-y-3">
                          {d.items.map((it) => (
                            <li key={it.id} className="flex items-center gap-3">
                              {it.image_url ? (
                                <img
                                  src={it.image_url}
                                  alt={it.name}
                                  className="h-14 w-14 rounded-lg border object-cover"
                                />
                              ) : (
                                <div className="h-14 w-14 rounded-lg border bg-muted" />
                              )}
                              <div className="flex-1">
                                <div className="text-sm font-medium">{it.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  ৳{Number(it.price)} × {it.quantity}
                                </div>
                              </div>
                              <div className="text-sm font-semibold">
                                ৳{Number(it.price) * it.quantity}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <aside className="rounded-xl border bg-card p-4 text-sm">
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Delivery
                        </h3>
                        {d.payment ? (
                          <>
                            <p className="font-medium">{d.payment.name}</p>
                            <p className="mt-1 whitespace-pre-line text-muted-foreground">
                              {d.payment.address}
                            </p>
                            <p className="mt-1 text-muted-foreground">📞 {d.payment.phone}</p>
                            <p className="mt-3 text-xs text-muted-foreground">
                              Payment: {d.payment.method}
                            </p>
                          </>
                        ) : (
                          <p className="text-muted-foreground">No delivery info.</p>
                        )}
                        <div className="mt-4 border-t pt-3 text-base font-semibold">
                          Total: ৳{Number(d.order.total_price)}
                        </div>
                        {["Pending", "Paid"].includes(d.order.status) && (
                          <button
                            onClick={() => cancel(d.order.id)}
                            className="mt-4 w-full rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                          >
                            Cancel order
                          </button>
                        )}
                      </aside>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
