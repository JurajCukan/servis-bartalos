import type { VehicleDetail, ServiceRecord } from "@/lib/queries/vehicles";

interface PdfInvoiceSummaryProps {
  vehicle: VehicleDetail;
  record: ServiceRecord;
}

export function PdfInvoiceSummary({ vehicle, record }: PdfInvoiceSummaryProps) {
  const today = new Date().toLocaleDateString("sk-SK");
  const docNumber = `FA-${new Date().getFullYear()}-${record.id.slice(0, 4).toUpperCase()}`;

  return (
    <div className="bg-white text-black font-sans w-full">
      <style>{`
        @page { size: A4; margin: 0; }
        body { background-color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; }
        .a4-page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 15mm 20mm; background: white; box-sizing: border-box; position: relative; }
        .pdf-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #222; padding-bottom: 12px; margin-bottom: 24px; }
      `}</style>

      <div className="a4-page">
        <div className="pdf-header">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Fakturačný podklad</h1>
            <div className="text-sm text-gray-500 mt-1">Kalkulácia ceny za servisné úkony a materiál.</div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <div className="font-bold text-gray-900 text-lg">Autoservis Bartalos</div>
            <div>Číslo dokladu: {docNumber}</div>
            <div>Dátum vystavenia: {today}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8 mt-8">
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Dodávateľ</h3>
            <div className="font-bold text-lg text-gray-900">Autoservis Bartalos</div>
            <div className="text-sm text-gray-600 mt-1">Prevádzka: XYZ</div>
            <div className="text-sm text-gray-600">IČO: 12345678, DIČ: 2020123456</div>
            <div className="text-sm text-gray-600 mt-1">Tel: +421 900 000 000</div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Odberateľ (Klient)</h3>
            <div className="font-bold text-lg text-gray-900">
              {vehicle.customer ? `${vehicle.customer.first_name} ${vehicle.customer.last_name}` : "Neznámy klient"}
            </div>
            {vehicle.customer && (
              <>
                <div className="text-sm text-gray-600 mt-1">Tel: {vehicle.customer.phone || "-"}</div>
                <div className="text-sm text-gray-600">Email: {vehicle.customer.email || "-"}</div>
              </>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Predmet servisu</h3>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm">
            <strong>Vozidlo:</strong> {vehicle.brand} {vehicle.model} ({vehicle.license_plate})<br />
            <strong>VIN:</strong> {vehicle.vin || "-"}<br />
            <strong>Názov úkonu:</strong> {record.title}
          </div>
        </div>

        <table className="w-full mb-8 text-sm">
          <thead>
            <tr className="border-b-2 border-gray-900 text-left">
              <th className="pb-2 text-gray-900 font-bold uppercase tracking-wider text-xs">Položka</th>
              <th className="pb-2 text-gray-900 font-bold uppercase tracking-wider text-xs text-right w-32">Cena spolu</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-4">
                <div className="font-semibold text-gray-900">Servisné práce a materiál</div>
                <div className="text-gray-500 whitespace-pre-wrap mt-1">{record.description}</div>
                {record.parts_replaced && (
                  <div className="text-gray-500 whitespace-pre-wrap mt-2 font-medium">Materiál: {record.parts_replaced}</div>
                )}
              </td>
              <td className="py-4 text-right font-semibold align-top text-gray-900">
                {(record.price || 0).toFixed(2).replace(".", ",")} €
              </td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-1/2 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
              <span>Základ pre DPH (20%):</span>
              <span>{((record.price || 0) / 1.2).toFixed(2).replace(".", ",")} €</span>
            </div>
            <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
              <span>Výška DPH (20%):</span>
              <span>{((record.price || 0) - ((record.price || 0) / 1.2)).toFixed(2).replace(".", ",")} €</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-300">
              <span className="font-bold text-gray-900">SPOLU NA ÚHRADU:</span>
              <span className="text-2xl font-bold text-gray-900">{(record.price || 0).toFixed(2).replace(".", ",")} €</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-[40mm] left-[20mm] right-[20mm]">
          <div className="grid grid-cols-2 gap-12">
            <div className="border-t border-gray-300 pt-2 text-center text-sm text-gray-500">
              Pečiatka a podpis dodávateľa
            </div>
            <div className="border-t border-gray-300 pt-2 text-center text-sm text-gray-500">
              Podpis odberateľa
            </div>
          </div>
        </div>

        <div className="absolute bottom-[15mm] left-[20mm] right-[20mm] text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
          Tento dokument slúži ako podklad pre fakturáciu. Nejde o daňový doklad. 
          <br/>Vygenerované elektronicky systémom Servisná knižka Bartalos
        </div>
      </div>
    </div>
  );
}
