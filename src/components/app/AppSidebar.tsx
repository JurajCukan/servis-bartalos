import { Car, CalendarDays, History } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";

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
  to: "/garage" | "/plan" | "/service-history";
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
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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
                const active = pathname.startsWith(item.match);
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="text-white data-[active=true]:bg-brand-accent/15 data-[active=true]:text-white"
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

      <SidebarFooter className="border-t border-brand-border bg-brand-bg p-4">
        <div>
          <p className="text-sm font-semibold text-white">Autoservis Bartalos</p>
          <p className="text-xs text-white/50">Interná servisná aplikácia</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
