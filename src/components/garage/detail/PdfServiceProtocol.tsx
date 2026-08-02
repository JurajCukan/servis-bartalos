import type { VehicleDetail, ServiceRecord } from "@/lib/queries/vehicles";

interface PdfServiceProtocolProps {
  vehicle: VehicleDetail;
  record: ServiceRecord;
}

export function PdfServiceProtocol({ vehicle, record }: PdfServiceProtocolProps) {
  const today = new Date().toLocaleDateString("sk-SK");
  const docNumber = `SP-${new Date().getFullYear()}-${record.id.slice(0, 4).toUpperCase()}`;

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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Servisný protokol</h1>
            <div className="text-sm text-gray-500 mt-1">Doklad o vykonaní servisnej prehliadky a opravy vozidla.</div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <div className="font-bold text-gray-900 text-lg">Autoservis Bartalos</div>
            <div>Číslo protokolu: {docNumber}</div>
            <div>Dátum vystavenia: {today}</div>
          </div>
        </div>

        <div className="flex justify-between items-end mb-4 mt-8">
          <h3 className="text-lg font-bold text-gray-900">1. Identifikácia vozidla a klienta</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-xl border border-gray-200">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Vozidlo</div>
            <div className="font-bold text-lg text-gray-900">{vehicle.brand} {vehicle.model}</div>
            <div className="text-sm text-gray-600 mt-1">EČV: <span className="font-semibold">{vehicle.license_plate}</span></div>
            <div className="text-sm text-gray-600">VIN: {vehicle.vin || "-"}</div>
            <div className="text-sm text-gray-600 mt-1">Stav pri servise: <span className="font-semibold">{record.mileage_at_service.toLocaleString("sk-SK")} km</span></div>
          </div>
          <div className="p-4 rounded-xl border border-gray-200">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Klient</div>
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

        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-bold text-gray-900">2. Záznam o servise</h3>
          <span className="inline-block bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider">
            {record.service_type}
          </span>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8">
          <h4 className="font-bold text-xl text-gray-900 mb-2">{record.title}</h4>
          <div className="text-sm text-gray-500 mb-4">Dátum servisu: {new Date(record.date).toLocaleDateString("sk-SK")}</div>
          <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {record.description}
          </div>
        </div>

        {record.parts_replaced && (
          <>
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-lg font-bold text-gray-900">3. Použitý materiál a diely</h3>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {record.parts_replaced}
            </div>
          </>
        )}

        {(record.next_service_km || record.next_service_date) && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-md text-sm text-gray-800 mb-8">
            <strong className="text-orange-900 block mb-1">Odporúčanie pre ďalší servis:</strong>
            Ďalšia prehliadka sa odporúča pri nájazde <strong>{record.next_service_km ? `${record.next_service_km.toLocaleString("sk-SK")} km` : "-"}</strong> 
            alebo dňa <strong>{record.next_service_date ? new Date(record.next_service_date).toLocaleDateString("sk-SK") : "-"}</strong>.
          </div>
        )}

        <div className="absolute bottom-[40mm] left-[20mm] right-[20mm]">
          <div className="grid grid-cols-2 gap-12">
            <div className="border-t border-gray-300 pt-2 text-center text-sm text-gray-500">
              Podpis technika<br/>
              <span className="font-semibold text-gray-800">{record.technician || "Autoservis Bartalos"}</span>
            </div>
            <div className="border-t border-gray-300 pt-2 text-center text-sm text-gray-500">
              Podpis klienta<br/>
              Súhlas s vykonanými prácami
            </div>
          </div>
        </div>

        <div className="absolute bottom-[15mm] left-[20mm] right-[20mm] text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
          Vygenerované elektronicky systémom Servisná knižka Bartalos
        </div>
      </div>
    </div>
  );
}
