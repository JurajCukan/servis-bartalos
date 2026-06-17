import { createFileRoute, redirect } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    throw redirect({ to: (await isAuthenticated()) ? "/garage" : "/login" });
  },
});
