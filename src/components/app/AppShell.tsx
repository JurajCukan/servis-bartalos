import type { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { UpdateBanner } from "./UpdateBanner";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-brand-bg text-brand-fg">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <UpdateBanner />
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-brand-border bg-brand-bg/95 px-4 backdrop-blur">
            <SidebarTrigger className="text-brand-fg hover:bg-brand-surface" />
            <span className="text-sm font-semibold tracking-tight text-brand-fg">
              Servisná knižka
            </span>
          </header>
          <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
