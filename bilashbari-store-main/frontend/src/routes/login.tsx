import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { setSession, type User } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({ meta: [{ title: "Sign in — Bilashbari" }] }),
});

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setSession(res.token, res.user);
      toast.success(`Welcome back, ${res.user.name.split(" ")[0]}`);
      nav({ to: res.user.role === "admin" ? "/admin" : "/" });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to your Bilashbari account.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">Email</span>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-lg border bg-background px-3" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">Password</span>
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-lg border bg-background px-3" />
        </label>
        <button disabled={loading}
          className="w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        New here?{" "}
        <Link to="/register" className="text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
