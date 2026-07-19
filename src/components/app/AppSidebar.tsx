import { Car, CalendarDays, History, Settings } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";

import logoAsset from "@/assets/autoservis-logo.png";

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

type NavItem = {
  key: string;
  label: string;
  icon: typeof Car;
  to: "/garage" | "/plan" | "/service-history" | "/settings";
  match: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: "vehicles", label: "Vozidlá", icon: Car, to: "/garage", match: "/garage" },
  { key: "today", label: "Dnešný plán", icon: CalendarDays, to: "/plan", match: "/plan" },
  {
    key: "history",
    label: "História servisu",
    icon: History,
    to: "/service-history",
    match: "/service-history",
  },
  { key: "settings", label: "Nastavenia", icon: Settings, to: "/settings", match: "/settings" },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-brand-border">
      <SidebarHeader className="border-b border-brand-border bg-brand-bg px-4 py-4">
        <div>
          <p className="text-base font-semibold text-brand-fg">Servisná knižka</p>
          <p className="text-xs text-brand-fg-muted">Autoservis Bartalos</p>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-brand-bg">
        <SidebarGroup>
          <SidebarGroupLabel className="text-brand-fg-subtle">Navigácia</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.match);
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="text-brand-fg data-[active=true]:bg-brand-accent/15 data-[active=true]:text-brand-fg"
                    >
                      <Link to={item.to}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-brand-border bg-brand-bg p-3">
        <div className="flex items-center justify-center p-2">
          <img
            src={logoAsset}
            alt="Autoservis Bartalos"
            className="h-20 w-auto object-contain"
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
