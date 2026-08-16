import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { vehicleDetailQuery, serviceHistoryQuery } from "@/lib/queries/vehicles";
import { DocumentLayout } from "@/features/documents/DocumentLayout";

export const Route = createFileRoute("/print/service-book/$vehicleId")({
  loader: async ({ params, context }) => {
    const vehicle = await context.queryClient.ensureQueryData(vehicleDetailQuery(params.vehicleId));
    if (!vehicle) throw notFound();
    await context.queryClient.ensureQueryData(serviceHistoryQuery(params.vehicleId));
  },
  component: ServiceBookPrint,
});

function ServiceBookPrint() {
  const { vehicleId } = Route.useParams();
  const { data: vehicle } = useSuspenseQuery(vehicleDetailQuery(vehicleId));
  const { data: records } = useSuspenseQuery(serviceHistoryQuery(vehicleId));

  useEffect(() => {
    // Notify electron when rendering is complete
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("document-ready"));
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!vehicle) return null;

  return (
    <DocumentLayout 
      documentTitle="Servisná knižka" 
      documentNumber={vehicle.license_plate}
    >
      <div className="mb-8">
        <h3 className="text-lg font-bold border-b pb-2 mb-4">Údaje o vozidle</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="font-semibold text-gray-500">Značka a model:</span> {vehicle.brand} {vehicle.model}</p>
            <p><span className="font-semibold text-gray-500">ŠPZ:</span> {vehicle.license_plate}</p>
            <p><span className="font-semibold text-gray-500">VIN:</span> {vehicle.vin || "-"}</p>
          </div>
          <div>
            <p><span className="font-semibold text-gray-500">Rok výroby:</span> {vehicle.year || "-"}</p>
            <p><span className="font-semibold text-gray-500">Motor:</span> {vehicle.engine || "-"}</p>
            <p><span className="font-semibold text-gray-500">Aktuálny nájazd:</span> {vehicle.current_mileage} km</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-bold border-b pb-2 mb-4">Servisná história</h3>
        {records && records.length > 0 ? (
          <div className="space-y-6">
            {records.map((record, index) => (
              <div key={record.id} className={`p-4 border rounded-lg ${index > 0 ? 'page-break-before' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-base">{record.title}</h4>
                    <p className="text-sm text-gray-500">{new Date(record.date).toLocaleDateString("sk-SK")}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold">Nájazd: {record.mileage_at_service} km</p>
                    <p className="text-gray-500">Technik: {record.technician || "-"}</p>
                  </div>
                </div>
                
                <div className="text-sm space-y-4">
                  <div>
                    <p className="font-semibold text-gray-500">Popis prác:</p>
                    <p className="whitespace-pre-wrap">{record.description || "Bez popisu"}</p>
                  </div>
                  
                  {record.parts_replaced && (
                    <div>
                      <p className="font-semibold text-gray-500">Vymenené diely:</p>
                      <p className="whitespace-pre-wrap">{record.parts_replaced}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Zatiaľ žiadne záznamy v histórii.</p>
        )}
      </div>
    </DocumentLayout>
  );
}
