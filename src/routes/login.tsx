import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { isAuthenticated, login } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Prihlásenie — Servisná knižka Bartalos" },
      { name: "description", content: "Prihlásenie do internej aplikácie autoservisu Bartalos." },
    ],
  }),
  beforeLoad: async () => {
    if (await isAuthenticated()) throw redirect({ to: "/garage" });
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate({ to: "/garage" });
    } catch {
      setError("Nesprávny email alebo heslo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-bg px-4 text-white">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Servisná knižka</h1>
          <p className="mt-1 text-sm text-white/60">Autoservis Bartalos</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-xl border border-brand-border bg-brand-surface p-6 shadow-2xl"
          noValidate
        >
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-brand-border bg-brand-bg px-3 py-2 text-sm text-white outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/40"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium">
              Heslo
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-brand-border bg-brand-bg px-3 py-2 text-sm text-white outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/40"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-brand-accent">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-brand-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Prihlasujem…" : "Prihlásiť sa"}
          </button>
        </form>
      </div>
    </main>
  );
}
