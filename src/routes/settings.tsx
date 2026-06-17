import { createFileRoute, Link } from "@tanstack/react-router";
import { Car } from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader";
import { ThemeSettingCard } from "@/components/settings/ThemeSettingCard";
import { AppInfoCard } from "@/components/settings/AppInfoCard";
import { DataSafetyCard } from "@/components/settings/DataSafetyCard";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Nastavenia — Servisná knižka Bartalos" },
      {
        name: "description",
        content: "Nastavenia aplikácie Servisná knižka Bartalos.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppShell>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <SettingsPageHeader />
        <ThemeSettingCard />
        <AppInfoCard />
        <DataSafetyCard />
        <Card className="border-brand-border bg-brand-surface text-brand-fg">
          <CardHeader>
            <CardTitle className="text-brand-fg">Rýchle akcie</CardTitle>
            <CardDescription className="text-brand-fg-muted">
              Pokračujte v práci v aplikácii.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              className="w-full bg-brand-accent text-white hover:bg-brand-accent-hover sm:w-auto"
            >
              <Link to="/garage">
                <Car className="mr-2 h-4 w-4" />
                Prejsť na garáž
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
