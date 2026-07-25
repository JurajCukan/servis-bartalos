import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app/AppShell";
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader";
import { UpdateSettingCard } from "@/components/settings/UpdateSettingCard";
import { ThemeSettingCard } from "@/components/settings/ThemeSettingCard";
import { AppInfoCard } from "@/components/settings/AppInfoCard";
import { DataSafetyCard } from "@/components/settings/DataSafetyCard";
import { PocketBaseStatusCard } from "@/components/settings/PocketBaseStatusCard";
import { ExportImportCard } from "@/components/settings/ExportImportCard";

export const Route = createFileRoute("/_authenticated/settings")({
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
        <UpdateSettingCard />
        <ExportImportCard />
        <PocketBaseStatusCard />
        <ThemeSettingCard />
        <AppInfoCard />
        <DataSafetyCard />
      </div>
    </AppShell>
  );
}
