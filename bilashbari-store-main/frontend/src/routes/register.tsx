import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { setSession, type User } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  component: Register,
  head: () => ({ meta: [{ title: "Create account — Bilashbari" }] }),
});

function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api<{ token: string; user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSession(res.token, res.user);
      toast.success("Account created");
      nav({ to: "/" });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Start shopping in seconds.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        {(["name", "email", "password"] as const).map((k) => (
          <label key={k} className="block text-sm">
            <span className="mb-1 block capitalize text-muted-foreground">{k}</span>
            <input
              required
              type={k === "password" ? "password" : k === "email" ? "email" : "text"}
              value={form[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              {...(k === "email"
                ? {
                    pattern: "[^\\s@]+@[^\\s@]+\\.[^\\s@]+",
                    title: "Enter a valid email like name@example.com",
                    placeholder: "you@example.com",
                  }
                : {})}
              {...(k === "password" ? { minLength: 6, title: "Minimum 6 characters" } : {})}
              className="h-11 w-full rounded-lg border bg-background px-3"
            />
          </label>
        ))}
        <button disabled={loading}
          className="w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
