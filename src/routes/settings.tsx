import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app/AppShell";
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader";
import { ThemeSettingCard } from "@/components/settings/ThemeSettingCard";
import { PocketBaseStatusCard } from "@/components/settings/PocketBaseStatusCard";
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
        <PocketBaseStatusCard />
        <ThemeSettingCard />
        <AppInfoCard />
        <DataSafetyCard />
      </div>
    </AppShell>
  );
}
