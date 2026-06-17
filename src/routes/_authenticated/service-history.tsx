import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";

import { AppShell } from "@/components/app/AppShell";
import { ServiceHistoryPageHeader } from "@/components/service-history/ServiceHistoryPageHeader";
import { ServiceHistoryFilters } from "@/components/service-history/ServiceHistoryFilters";
import { ServiceHistoryList } from "@/components/service-history/ServiceHistoryList";
import { ServiceHistorySkeleton } from "@/components/service-history/ServiceHistorySkeleton";
import { EmptyServiceHistoryState } from "@/components/service-history/EmptyServiceHistoryState";
import { EmptyState } from "@/components/garage/EmptyState";
import { serviceHistoryQuery } from "@/lib/queries/serviceHistory";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  type: fallback(z.string(), "all").default("all"),
});

export const Route = createFileRoute("/_authenticated/service-history")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({ meta: [{ title: "História servisu — Servisná knižka Bartalos" }] }),
  component: ServiceHistoryPage,
});

function ServiceHistoryPage() {
  const { q, type } = Route.useSearch();
  const navigate = useNavigate({ from: "/service-history" });
  const { data, isLoading, error } = useQuery(serviceHistoryQuery);

  const filtered = useMemo(() => {
    const items = data ?? [];
    const needle = q.trim().toLowerCase();
    return items.filter((it) => {
      if (type !== "all" && it.service_type !== type) return false;
      if (!needle) return true;
      const customer = it.vehicle?.customer
        ? `${it.vehicle.customer.first_name} ${it.vehicle.customer.last_name}`
        : "";
      const haystack = [
        customer,
        it.vehicle?.license_plate ?? "",
        it.vehicle?.brand ?? "",
        it.vehicle?.model ?? "",
        it.title,
        it.service_type,
        it.description,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [data, q, type]);

  const total = data?.length ?? 0;

  return (
    <AppShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <ServiceHistoryPageHeader />
        <ServiceHistoryFilters
          q={q}
          type={type}
          onQChange={(v) =>
            navigate({ search: (prev) => ({ ...prev, q: v }), replace: true })
          }
          onTypeChange={(v) =>
            navigate({ search: (prev) => ({ ...prev, type: v }), replace: true })
          }
        />
        {isLoading ? (
          <ServiceHistorySkeleton />
        ) : error ? (
          <EmptyState
            title="Nepodarilo sa načítať históriu"
            description="Skúste obnoviť stránku."
          />
        ) : total === 0 ? (
          <EmptyServiceHistoryState variant="empty" />
        ) : filtered.length === 0 ? (
          <EmptyServiceHistoryState variant="no-results" />
        ) : (
          <ServiceHistoryList items={filtered} />
        )}
      </div>
    </AppShell>
  );
}
