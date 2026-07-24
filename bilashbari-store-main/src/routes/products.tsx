import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import { cart } from "@/lib/cart";
import { toast } from "sonner";
import { Search, X } from "lucide-react";


type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  discount: number;
  image_url: string;
  category_name?: string;
  category_slug?: string;
};
type Category = { id: number; name: string; slug: string };

const searchSchema = z.object({ category: z.string().optional(), q: z.string().optional() });

export const Route = createFileRoute("/products")({
  validateSearch: searchSchema,
  component: Products,
  head: () => ({
    meta: [
      { title: "Shop — Bilashbari" },
      { name: "description", content: "Browse trees, indoor plants, gardening tools, tubs, seeds and fertilizers." },
    ],
  }),
});

function Products() {
  const { category, q } = Route.useSearch();
  const navigate = useNavigate({ from: "/products" });
  const query = (q || "").trim().toLowerCase();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api("/categories"),
    retry: false,
  });
  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ["products", category],
    queryFn: () => api(`/products${category ? `?category=${category}` : ""}`),
    retry: false,
  });

  const filtered = query
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.description || "").toLowerCase().includes(query) ||
          (p.category_name || "").toLowerCase().includes(query),
      )
    : products;

  const activeCategoryName = category
    ? categories.find((c) => c.slug === category)?.name || category
    : "All products";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6">
        <h1 className="font-display text-4xl">Shop</h1>
        <p className="mt-1 text-muted-foreground">
          {category ? `Category: ${category}` : "All products from our nursery"}
        </p>
      </header>

      <div className="mb-4 relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={q || ""}
          onChange={(e) =>
            navigate({
              search: (prev: any) => ({ ...prev, q: e.target.value || undefined }),
              replace: true,
            })
          }
          placeholder={`Search in ${activeCategoryName}…`}
          className="h-11 w-full rounded-full border bg-card pl-11 pr-11 text-sm outline-none focus:border-primary"
        />
        {q && (
          <button
            onClick={() =>
              navigate({ search: (prev: any) => ({ ...prev, q: undefined }), replace: true })
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => navigate({ search: (prev: any) => ({ ...prev, category: undefined }) })}
          className={`rounded-full border px-4 py-1.5 text-sm ${!category ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate({ search: (prev: any) => ({ ...prev, category: c.slug }) })}
            className={`rounded-full border px-4 py-1.5 text-sm ${category === c.slug ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
          >
            {c.name}
          </button>
        ))}
      </div>


      {error && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Couldn't reach the API. Start the backend at <code>backend/</code> and set{" "}
          <code>VITE_API_URL</code>.
        </div>
      )}

      {isLoading && <div className="text-muted-foreground">Loading…</div>}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((p) => {
          const final = Number(p.price) - Number(p.discount || 0);
          return (
            <article key={p.id} className="group overflow-hidden rounded-2xl border bg-card">
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {p.category_name}
                </div>
                <h3 className="mt-1 line-clamp-1 font-medium">{p.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-primary">৳{final}</span>
                    {p.discount > 0 && (
                      <span className="text-xs text-muted-foreground line-through">
                        ৳{p.price}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      cart.add({
                        product_id: p.id,
                        name: p.name,
                        price: final,
                        image_url: p.image_url,
                      });
                      toast.success(`Added ${p.name}`);
                    }}
                    className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        {!isLoading && filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            {query
              ? `No products match "${q}"${category ? ` in ${activeCategoryName}` : ""}.`
              : "No products found."}
          </div>
        )}
      </div>
    </div>
  );
}
