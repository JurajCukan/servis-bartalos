import { createFileRoute, notFound, useSearch } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { vehicleDetailQuery, serviceHistoryQuery } from "@/lib/queries/vehicles";
import { PdfTemplate } from "@/components/garage/detail/PdfTemplate";
import { PdfServiceProtocol } from "@/components/garage/detail/PdfServiceProtocol";
import { PdfInvoiceSummary } from "@/components/garage/detail/PdfInvoiceSummary";

type PrintSearch = {
  recordId?: string;
};

export const Route = createFileRoute("/print/$type/$vehicleId")({
  validateSearch: (search: Record<string, unknown>): PrintSearch => {
    return {
      recordId: search.recordId as string | undefined,
    };
  },
  loader: async ({ params, context }) => {
    const vehicle = await context.queryClient.ensureQueryData(vehicleDetailQuery(params.vehicleId));
    if (!vehicle) throw notFound();
    await context.queryClient.ensureQueryData(serviceHistoryQuery(params.vehicleId));
  },
  component: PrintPage,
});

function PrintPage() {
  const { type, vehicleId } = Route.useParams();
  const search = Route.useSearch();
  const { data: vehicle } = useSuspenseQuery(vehicleDetailQuery(vehicleId));
  const { data: records } = useSuspenseQuery(serviceHistoryQuery(vehicleId));

  useEffect(() => {
    // Small timeout to allow images/fonts to render before telling Electron to print
    const timer = setTimeout(() => {
      if (window.electronAPI) {
        window.electronAPI.notifyPdfReady();
      }
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (!vehicle) return null;

  if (type === "book") {
    return <PdfTemplate vehicle={vehicle} records={records} />;
  }

  if (type === "protocol" || type === "invoice") {
    const record = records.find(r => r.id === search.recordId);
    if (!record) {
      return <div className="p-8 text-red-500">Záznam sa nenašiel.</div>;
    }

    if (type === "protocol") {
      return <PdfServiceProtocol vehicle={vehicle} record={record} />;
    } else {
      return <PdfInvoiceSummary vehicle={vehicle} record={record} />;
    }
  }

  return <div className="p-8 text-red-500">Neznámy typ dokumentu.</div>;
}
