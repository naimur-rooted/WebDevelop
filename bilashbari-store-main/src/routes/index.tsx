import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ArrowRight, Leaf, Truck, ShieldCheck } from "lucide-react";

type Product = {
  id: number;
  name: string;
  price: number;
  discount: number;
  image_url: string;
  category_slug?: string;
};
type Category = { id: number; name: string; slug: string };

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Bilashbari — Plants, Tools & Garden Essentials" },
      {
        name: "description",
        content:
          "Bilashbari is your neighbourhood nursery online — trees, indoor plants, tubs, seeds and gardening tools delivered to your door.",
      },
    ],
  }),
});

function Home() {
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => api("/products"),
    retry: false,
  });
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api("/categories"),
    retry: false,
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-background to-accent/20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Leaf className="h-3.5 w-3.5" /> New arrivals from our nursery
            </span>
            <h1 className="mt-4 font-display text-5xl leading-[1.05] md:text-6xl">
              Bring the <span className="text-primary">garden</span> home.
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              Hand-picked trees, indoor plants, tubs and gardening essentials — delivered fresh
              across the city. Cash on delivery available.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Shop the collection <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/products"
                search={{ category: "indoor-plants" } as any}
                className="inline-flex h-11 items-center rounded-full border px-6 text-sm font-medium hover:bg-muted"
              >
                Indoor plants
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-primary/30 to-accent/40 shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=900"
                alt="Green plants arranged together"
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Truck, title: "Free delivery over ৳1000", body: "Fresh from nursery to door." },
            { icon: ShieldCheck, title: "Healthy plant promise", body: "Replacement if damaged." },
            { icon: Leaf, title: "Grown with care", body: "Sourced from local growers." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-5">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 text-base font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl">Shop by category</h2>
          <Link to="/products" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/products"
              search={{ category: c.slug } as any}
              className="group rounded-2xl border bg-card p-4 text-center hover:border-primary hover:bg-primary/5"
            >
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                <Leaf className="h-5 w-5" />
              </div>
              <div className="text-sm font-medium">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl">Fresh picks</h2>
          <Link to="/products" className="text-sm text-primary hover:underline">
            Shop all →
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.slice(0, 8).map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
          {products.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              Start your local backend, then refresh to see products.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export function ProductCard({ p }: { p: Product }) {
  const final = Number(p.price) - Number(p.discount || 0);
  return (
    <Link
      to="/products"
      className="group overflow-hidden rounded-2xl border bg-card transition hover:shadow-md"
    >
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={p.image_url}
          alt={p.name}
          className="h-full w-full object-cover transition group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-3">
        <div className="line-clamp-1 text-sm font-medium">{p.name}</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-base font-semibold text-primary">৳{final}</span>
          {p.discount > 0 && (
            <span className="text-xs text-muted-foreground line-through">৳{p.price}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
