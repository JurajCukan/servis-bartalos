import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { VehicleDetailHeader } from "@/components/garage/detail/VehicleDetailHeader";
import { CustomerInfoCard } from "@/components/garage/detail/CustomerInfoCard";
import { VehicleSpecsCard } from "@/components/garage/detail/VehicleSpecsCard";
import { ServiceHistorySection } from "@/components/garage/detail/ServiceHistorySection";
import { VehicleDetailSkeleton } from "@/components/garage/detail/VehicleDetailSkeleton";
import { AddServiceRecordDialog } from "@/components/garage/detail/AddServiceRecordDialog";
import { ScheduleServiceDialog } from "@/components/garage/detail/ScheduleServiceDialog";
import { vehicleDetailQuery, serviceHistoryQuery } from "@/lib/queries/vehicles";

export const Route = createFileRoute("/_authenticated/garage/$vehicleId")({
  head: () => ({ meta: [{ title: "Detail vozidla — Servisná knižka Bartalos" }] }),
  loader: async ({ params, context }) => {
    const vehicle = await context.queryClient.ensureQueryData(
      vehicleDetailQuery(params.vehicleId),
    );
    if (!vehicle) throw notFound();
    context.queryClient.prefetchQuery(serviceHistoryQuery(params.vehicleId));
  },
  pendingComponent: () => (
    <AppShell>
      <VehicleDetailSkeleton />
    </AppShell>
  ),
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="mx-auto max-w-3xl rounded-xl border border-brand-border bg-brand-surface p-8 text-center">
        <h1 className="text-xl font-semibold text-white">Nepodarilo sa načítať vozidlo</h1>
        <p className="mt-2 text-sm text-white/60">{error.message}</p>
        <Link
          to="/garage"
          className="mt-6 inline-block rounded-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Späť na garáž
        </Link>
      </div>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <div className="mx-auto max-w-3xl rounded-xl border border-brand-border bg-brand-surface p-8 text-center">
        <h1 className="text-xl font-semibold text-white">Vozidlo sa nenašlo</h1>
        <p className="mt-2 text-sm text-white/60">Toto vozidlo neexistuje alebo bolo odstránené.</p>
        <Link
          to="/garage"
          className="mt-6 inline-block rounded-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Späť na garáž
        </Link>
      </div>
    </AppShell>
  ),
  component: VehicleDetailPage,
});

function VehicleDetailPage() {
  const { vehicleId } = Route.useParams();
  const { data: vehicle } = useSuspenseQuery(vehicleDetailQuery(vehicleId));
  const history = useQuery(serviceHistoryQuery(vehicleId));
  const [addOpen, setAddOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  if (!vehicle) return null;

  const placeholder = () => toast.info("Táto funkcia bude doplnená v ďalšom kroku");
  const openAdd = () => setAddOpen(true);
  const openSchedule = () => setScheduleOpen(true);

  return (
    <AppShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <VehicleDetailHeader
          vehicle={vehicle}
          onAction={placeholder}
          onSchedule={openSchedule}
          onAddRecord={openAdd}
        />
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col gap-6">
            <CustomerInfoCard customer={vehicle.customer} />
            <VehicleSpecsCard vehicle={vehicle} />
          </div>
          <ServiceHistorySection
            records={history.data}
            loading={history.isLoading}
            onAdd={openAdd}
          />
        </div>
      </div>
      <AddServiceRecordDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        vehicleId={vehicleId}
        currentMileage={vehicle.current_mileage}
      />
      <ScheduleServiceDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        vehicleId={vehicleId}
      />
    </AppShell>
  );
}
