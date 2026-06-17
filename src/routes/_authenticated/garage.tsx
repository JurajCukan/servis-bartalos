import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { logout } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/garage")({
  head: () => ({
    meta: [{ title: "Dashboard — Servisná knižka Bartalos" }],
  }),
  component: GaragePage,
});

function GaragePage() {
  const navigate = useNavigate();
  async function handleLogout() {
    await logout();
    navigate({ to: "/login" });
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-brand-bg px-4 text-white">
      <h1 className="text-2xl font-semibold">Dashboard — coming soon</h1>
      <button
        onClick={handleLogout}
        className="rounded-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-accent-hover"
      >
        Odhlásiť sa
      </button>
    </main>
  );
}
