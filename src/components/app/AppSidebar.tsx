import { useNavigate } from "@tanstack/react-router";
import { Car, CalendarDays, History, Bell, Settings, LogOut } from "lucide-react";
import { toast } from "sonner";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { logout } from "@/lib/auth";
import { useProfileQuery } from "@/lib/queries/profile";

const NAV_ITEMS = [
  { key: "vehicles", label: "Vozidlá", icon: Car, active: true },
  { key: "today", label: "Dnešný plán", icon: CalendarDays },
  { key: "history", label: "História servisu", icon: History },
  { key: "alerts", label: "Upozornenia", icon: Bell },
  { key: "settings", label: "Nastavenia", icon: Settings },
] as const;

function initials(source: string) {
  const parts = source.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function AppSidebar() {
  const { data } = useProfileQuery();
  const navigate = useNavigate();

  const displayName = data?.profile?.name || data?.email?.split("@")[0] || "Používateľ";
  const role = data?.profile?.role ?? "technik";
  const initialsText = initials(displayName);

  async function handleLogout() {
    await logout();
    navigate({ to: "/login" });
  }

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-brand-border">
      <SidebarHeader className="border-b border-brand-border bg-brand-bg px-4 py-4">
        <div>
          <p className="text-base font-semibold text-white">Servisná knižka</p>
          <p className="text-xs text-white/50">Autoservis Bartalos</p>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-brand-bg">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/40">Navigácia</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const disabled = !item.active;
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={item.active}
                      disabled={disabled}
                      onClick={
                        disabled
                          ? () => toast.info("Pripravuje sa")
                          : undefined
                      }
                      className="text-white data-[active=true]:bg-brand-accent/15 data-[active=true]:text-white"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-brand-border bg-brand-bg p-3">
        <div className="flex items-center gap-3">
          <div
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-accent text-sm font-semibold text-white"
          >
            {initialsText}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{displayName}</p>
            <p className="text-xs capitalize text-white/50">{role}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-sm font-medium text-white transition hover:border-brand-accent hover:text-brand-accent"
        >
          <LogOut className="h-4 w-4" />
          Odhlásiť sa
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
