import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Package, ShoppingBag, Users, Coins, Tag, LayoutDashboard, Wallet, Plus, Trash2, Pencil } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — Bilashbari" }, { name: "robots", content: "noindex" }] }),
});

type Tab = "overview" | "products" | "categories" | "orders" | "payments";

function AdminPage() {
  const user = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (user === null) return;
    if (user && user.role !== "admin") {
      toast.error("Admin only");
      navigate({ to: "/" });
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl">Admin access</h1>
        <p className="mt-2 text-muted-foreground">Please sign in with an admin account.</p>
      </div>
    );
  }
  if (user.role !== "admin") return null;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Package },
    { id: "categories", label: "Categories", icon: Tag },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "payments", label: "Payments", icon: Wallet },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6">
        <h1 className="font-display text-4xl">Admin dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage Bilashbari's catalog, orders and payments.</p>
      </header>
      <div className="mb-6 flex flex-wrap gap-2 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm transition ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview />}
      {tab === "products" && <ProductsAdmin />}
      {tab === "categories" && <CategoriesAdmin />}
      {tab === "orders" && <OrdersAdmin />}
      {tab === "payments" && <PaymentsAdmin />}
    </div>
  );
}

function Overview() {
  const { data } = useQuery<{ users: number; products: number; orders: number; revenue: number }>({
    queryKey: ["admin", "stats"],
    queryFn: () => api("/admin/stats"),
    retry: false,
  });
  const cards = [
    { label: "Users", value: data?.users ?? "—", icon: Users },
    { label: "Products", value: data?.products ?? "—", icon: Package },
    { label: "Orders", value: data?.orders ?? "—", icon: ShoppingBag },
    { label: "Revenue", value: data ? `৳${data.revenue}` : "—", icon: Coins },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</div>
              <div className="text-2xl font-semibold">{c.value}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

type Category = { id: number; name: string; slug: string };
type Product = {
  id: number;
  name: string;
  description: string;
  category_id: number;
  price: number;
  discount: number;
  image_url: string;
  stock: number;
};

function ProductsAdmin() {
  const qc = useQueryClient();
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["products"], queryFn: () => api("/products"), retry: false });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["categories"], queryFn: () => api("/categories"), retry: false });
  const [editing, setEditing] = useState<Partial<Product> | null>(null);

  async function save() {
    if (!editing) return;
    try {
      if (editing.id) {
        await api(`/products/${editing.id}`, { method: "PUT", body: JSON.stringify(editing) });
      } else {
        await api(`/products`, { method: "POST", body: JSON.stringify(editing) });
      }
      toast.success("Saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["products"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }
  async function del(id: number) {
    if (!confirm("Delete this product?")) return;
    await api(`/products/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["products"] });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() =>
            setEditing({ name: "", description: "", category_id: categories[0]?.id, price: 0, discount: 0, image_url: "", stock: 100 })
          }
          className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> New product
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{p.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">৳{p.price}</td>
                <td className="px-4 py-3">৳{p.discount}</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing(p)} className="mr-2 rounded p-2 hover:bg-muted">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => del(p.id)} className="rounded p-2 text-destructive hover:bg-muted">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl">{editing.id ? "Edit product" : "New product"}</h3>
            <div className="mt-4 grid gap-3">
              <input placeholder="Name" value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="h-10 rounded-lg border bg-background px-3 text-sm" />
              <textarea placeholder="Description" value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="min-h-20 rounded-lg border bg-background p-3 text-sm" />
              <select value={editing.category_id || ""} onChange={(e) => setEditing({ ...editing, category_id: Number(e.target.value) })}
                className="h-10 rounded-lg border bg-background px-3 text-sm">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="grid grid-cols-3 gap-3">
                <input type="number" placeholder="Price" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                  className="h-10 rounded-lg border bg-background px-3 text-sm" />
                <input type="number" placeholder="Discount" value={editing.discount ?? 0} onChange={(e) => setEditing({ ...editing, discount: Number(e.target.value) })}
                  className="h-10 rounded-lg border bg-background px-3 text-sm" />
                <input type="number" placeholder="Stock" value={editing.stock ?? 0} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })}
                  className="h-10 rounded-lg border bg-background px-3 text-sm" />
              </div>
              <input placeholder="Image URL" value={editing.image_url || ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                className="h-10 rounded-lg border bg-background px-3 text-sm" />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-full px-4 py-2 text-sm hover:bg-muted">Cancel</button>
              <button onClick={save} className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoriesAdmin() {
  const qc = useQueryClient();
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["categories"], queryFn: () => api("/categories"), retry: false });
  const [name, setName] = useState("");

  async function add() {
    if (!name.trim()) return;
    const slug = name.toLowerCase().trim().replace(/\s+/g, "-");
    await api("/categories", { method: "POST", body: JSON.stringify({ name, slug }) });
    setName("");
    qc.invalidateQueries({ queryKey: ["categories"] });
    toast.success("Category added");
  }
  async function del(id: number) {
    if (!confirm("Delete category?")) return;
    await api(`/categories/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["categories"] });
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_320px]">
      <div className="overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Slug</th><th></th></tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => del(c.id)} className="rounded p-2 text-destructive hover:bg-muted">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="h-fit rounded-2xl border bg-card p-4">
        <h3 className="font-display text-lg">Add category</h3>
        <input placeholder="e.g. Succulents" value={name} onChange={(e) => setName(e.target.value)}
          className="mt-3 h-10 w-full rounded-lg border bg-background px-3 text-sm" />
        <button onClick={add} className="mt-3 w-full rounded-full bg-primary py-2 text-sm text-primary-foreground">Add</button>
      </div>
    </div>
  );
}

const STATUSES = ["Pending", "Paid", "Shipped", "Delivered", "Cancelled"] as const;

function OrdersAdmin() {
  const qc = useQueryClient();
  const { data: orders = [] } = useQuery<any[]>({ queryKey: ["admin", "orders"], queryFn: () => api("/admin/orders"), retry: false });

  async function setStatus(id: number, status: string) {
    await api(`/admin/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
    qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    toast.success(`Order #${id} → ${status}`);
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Placed</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t">
              <td className="px-4 py-3 font-medium">#{o.id}</td>
              <td className="px-4 py-3">
                <div>{o.user_name}</div>
                <div className="text-xs text-muted-foreground">{o.user_email}</div>
              </td>
              <td className="px-4 py-3">৳{o.total_price}</td>
              <td className="px-4 py-3">
                <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}
                  className="h-8 rounded-lg border bg-background px-2 text-xs">
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{new Date(o.created_at).toLocaleString()}</td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No orders yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PaymentsAdmin() {
  const { data: payments = [] } = useQuery<any[]>({ queryKey: ["admin", "payments"], queryFn: () => api("/admin/payments"), retry: false });
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Method</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Address</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Order status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="px-4 py-3 font-medium">#{p.order_id}</td>
              <td className="px-4 py-3">{p.method}</td>
              <td className="px-4 py-3">{p.name}</td>
              <td className="px-4 py-3">{p.phone}</td>
              <td className="px-4 py-3 text-muted-foreground">{p.address}</td>
              <td className="px-4 py-3">৳{p.total_price}</td>
              <td className="px-4 py-3">{p.status}</td>
            </tr>
          ))}
          {payments.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No payments yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
