import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider, useTheme } from "@/components/theme/ThemeProvider";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4 text-brand-fg">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Stránka sa nenašla</h2>
        <p className="mt-2 text-sm text-brand-fg-muted">
          Hľadaná stránka neexistuje alebo bola presunutá.
        </p>
        <div className="mt-6">
          <Link
            to="/garage"
            className="inline-flex items-center justify-center rounded-md bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-fg transition hover:bg-brand-accent-hover"
          >
            Späť na garáž
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4 text-brand-fg">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          Stránku sa nepodarilo načítať
        </h1>
        <p className="mt-2 text-sm text-brand-fg-muted">
          Niečo sa pokazilo. Skúste to znova alebo sa vráťte do garáže.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-fg transition hover:bg-brand-accent-hover"
          >
            Skúsiť znova
          </button>
          <a
            href="/garage"
            className="inline-flex items-center justify-center rounded-md border border-brand-border bg-transparent px-4 py-2 text-sm font-medium text-brand-fg transition hover:bg-brand-surface"
          >
            Späť na garáž
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Servisná knižka Bartalos" },
      {
        name: "description",
        content: "Interná servisná aplikácia autoservisu Bartalos.",
      },
      { property: "og:title", content: "Servisná knižka Bartalos" },
      {
        property: "og:description",
        content: "Interná servisná aplikácia autoservisu Bartalos.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "sk_SK" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <ThemedToaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster theme={resolvedTheme} position="top-right" richColors />;
}
