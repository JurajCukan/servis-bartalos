import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    if (!(await isAuthenticated())) throw redirect({ to: "/login" });
  },
  component: () => <Outlet />,
});
