import { Link } from "@tanstack/react-router";
import { ShoppingCart, User as UserIcon, Leaf, LogOut } from "lucide-react";
import { useCart } from "@/lib/cart";
import { clearSession, useAuth } from "@/lib/auth";

export function SiteHeader() {
  const items = useCart();
  const user = useAuth();
  const count = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold">Bilashbari</span>
        </Link>
        <nav className="hidden gap-6 text-sm md:flex">
          <Link to="/" className="hover:text-primary" activeProps={{ className: "text-primary" }}>Home</Link>
          <Link to="/products" className="hover:text-primary" activeProps={{ className: "text-primary" }}>Shop</Link>
          {user && user.role !== "admin" && (
            <Link to="/orders" className="hover:text-primary" activeProps={{ className: "text-primary" }}>My Orders</Link>
          )}
          {user?.role === "admin" && (
            <Link to="/admin" className="hover:text-primary" activeProps={{ className: "text-primary" }}>Admin</Link>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/cart" className="relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted">
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:inline">Hi, {user.name.split(" ")[0]}</span>
              <button
                onClick={() => clearSession()}
                className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm hover:bg-muted"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex h-10 items-center gap-1 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <UserIcon className="h-4 w-4" /> Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-primary" />
            <span className="font-display text-base text-foreground">Bilashbari</span>
          </div>
          <p>© {new Date().getFullYear()} Bilashbari. Grown with care.</p>
        </div>
      </div>
    </footer>
  );
}
