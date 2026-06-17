import { createFileRoute, redirect } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    throw redirect({ to: (await isAuthenticated()) ? "/garage" : "/login" });
  },
});
