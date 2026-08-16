import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { DocumentLayout } from "@/features/documents/DocumentLayout";
import { formatCurrency } from "@/features/documents/documentFormatters";

export const Route = createFileRoute("/print/service-protocol/$serviceRecordId")({
  loader: async ({ params, context }) => {
    // We need to fetch the record, but since we don't have a direct query for just record,
    // we'll get all records and find it, or we could add a query for single record.
    // Assuming we have a way to fetch it, but let's fetch all records and find it for now.
    // Or even better, call the IPC directly in a query.
    return {};
  },
  component: ServiceProtocolPrint,
});

const serviceRecordDetailQuery = (recordId: string) => ({
  queryKey: ["serviceRecord", recordId],
  queryFn: async () => {
    if (!window.electronAPI) return null;
    const records = await window.electronAPI.db.getAllServiceRecords();
    return records.find((r: any) => r.id === recordId) || null;
  },
});

const serviceRecordItemsQuery = (recordId: string) => ({
  queryKey: ["serviceRecordItems", recordId],
  queryFn: async () => {
    if (!window.electronAPI) return [];
    return window.electronAPI.db.getServiceRecordItems(recordId);
  },
});

function ServiceProtocolPrint() {
  const { serviceRecordId } = Route.useParams();
  const { data: record } = useSuspenseQuery(serviceRecordDetailQuery(serviceRecordId));
  const { data: items } = useQuery(serviceRecordItemsQuery(serviceRecordId));

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("document-ready"));
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!record) {
    return <div className="p-8 text-red-500">Záznam sa nenašiel.</div>;
  }

  const { vehicle, customer } = record;

  return (
    <DocumentLayout 
      documentTitle="Servisný protokol" 
      documentNumber={`SP-${record.id.substring(0, 8).toUpperCase()}`}
    >
      <div className="grid grid-cols-2 gap-8 mb-8 border-b pb-8">
        <div>
          <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase">Zákazník</h3>
          <p className="font-semibold text-lg">{customer?.first_name} {customer?.last_name}</p>
          {customer?.phone && <p>{customer.phone}</p>}
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase">Vozidlo</h3>
          <p className="font-semibold text-lg">{vehicle?.brand} {vehicle?.model}</p>
          <p>ŠPZ: {vehicle?.license_plate}</p>
          <p>Nájazd: {record.mileage_at_service} km</p>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-xl font-bold">Záznam o servise</h3>
          <p className="text-gray-600">Dátum: {new Date(record.date).toLocaleDateString("sk-SK")}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="font-bold mb-1">{record.title}</h4>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{record.description}</p>
        </div>
        
        {/* Zobrazenie položiek ak existujú, inak starý systém */}
        {items && items.length > 0 ? (
          <div className="mb-6">
            <h4 className="font-bold mb-3">Vykonané práce a diely</h4>
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="py-2 px-3 rounded-l-lg">Položka</th>
                  <th className="py-2 px-3 text-right">Množstvo</th>
                  <th className="py-2 px-3 text-right">Jednotková cena</th>
                  <th className="py-2 px-3 text-right rounded-r-lg">Spolu</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item: any) => (
                  <tr key={item.id}>
                    <td className="py-2 px-3">
                      <p className="font-medium">{item.name}</p>
                      {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                    </td>
                    <td className="py-2 px-3 text-right">{item.quantity} {item.unit}</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="py-2 px-3 text-right font-medium">{formatCurrency(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="py-4 px-3 text-right font-bold">Celková suma:</td>
                  <td className="py-4 px-3 text-right font-bold text-lg">
                    {formatCurrency(items.reduce((acc: number, item: any) => acc + (item.total_price || 0), 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          record.parts_replaced && (
            <div className="mb-6">
              <h4 className="font-bold mb-2">Použité diely a materiál</h4>
              <p className="text-sm whitespace-pre-wrap border p-4 rounded-lg">{record.parts_replaced}</p>
              {record.price > 0 && (
                <p className="text-right mt-4 font-bold text-lg">
                  Celková cena: {formatCurrency(record.price)}
                </p>
              )}
            </div>
          )
        )}
      </div>

      <div className="mt-20 grid grid-cols-2 gap-16 text-center">
        <div>
          <div className="border-b border-gray-400 pb-1 mb-2 h-16"></div>
          <p className="text-sm font-medium">Podpis technika</p>
          <p className="text-xs text-gray-500">{record.technician}</p>
        </div>
        <div>
          <div className="border-b border-gray-400 pb-1 mb-2 h-16"></div>
          <p className="text-sm font-medium">Podpis zákazníka</p>
        </div>
      </div>
    </DocumentLayout>
  );
}
