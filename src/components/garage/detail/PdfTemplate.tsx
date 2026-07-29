import type { Vehicle, ServiceRecord } from "@/lib/queries/vehicles";

interface PdfTemplateProps {
  vehicle: Vehicle;
  records: ServiceRecord[];
}

export function PdfTemplate({ vehicle, records }: PdfTemplateProps) {
  const today = new Date().toLocaleDateString("sk-SK");
  const totalCost = records.reduce((sum, r) => sum + (r.price || 0), 0);
  const lastServiceDate = records.length > 0 ? new Date(records[0].date).toLocaleDateString("sk-SK") : "Žiadny";
  const docNumber = `SK-${new Date().getFullYear()}-${vehicle.id.toString().slice(-4).padStart(4, "0")}`;

  return (
    <div className="bg-white text-black font-sans w-full">
      <style>{`
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page-break {
            page-break-before: always;
          }
        }
        .a4-page {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 15mm 20mm;
          background: white;
          box-sizing: border-box;
          position: relative;
        }
        .pdf-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #222;
          padding-bottom: 12px;
          margin-bottom: 24px;
        }
      `}</style>

      {/* STRANA 1: Prehľad */}
      <div className="a4-page">
        <div className="pdf-header">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Servisná knižka vozidla</h1>
          </div>
          <div className="text-right text-sm text-gray-600">
            <div className="font-bold text-gray-900">Autoservis Bartalos</div>
            <div>Číslo dokumentu: {docNumber}</div>
            <div>Dátum exportu: {today}</div>
          </div>
        </div>
        <div className="text-sm text-gray-500 mb-6 -mt-4">
          Profesionálny export servisnej histórie vozidla.
        </div>

        <div className="bg-gray-900 text-white rounded-xl p-8 mb-8 shadow-sm">
          <div className="text-xs uppercase tracking-widest text-gray-400 mb-2 font-semibold">
            Export z aplikácie
          </div>
          <h2 className="text-2xl font-bold mb-3">Prehľad vozidla a servisnej histórie</h2>
          <p className="text-gray-300 text-sm leading-relaxed max-w-2xl">
            Tento dokument obsahuje identifikáciu vozidla, základné prevádzkové údaje a jednotlivé
            vykonané servisné zásahy zoradené v samostatných listoch.
          </p>
        </div>

        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-bold text-gray-900">Identifikácia vozidla</h3>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Strana 1</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <InfoBox label="ZNAČKA A MODEL" value={`${vehicle.make} ${vehicle.model}`} className="col-span-1" />
          <InfoBox label="EČV" value={vehicle.plate} />
          <InfoBox label="VIN" value={vehicle.vin || "-"} />
          <InfoBox label="ROK VÝROBY" value={vehicle.year?.toString() || "-"} />
          <InfoBox label="PALIVO" value={vehicle.fuel_type || "-"} />
          <InfoBox label="OBJEM MOTORA" value={vehicle.engine_capacity ? `${vehicle.engine_capacity} cm³` : "-"} />
          <InfoBox label="AKTUÁLNY STAV KM" value={`${vehicle.current_mileage.toLocaleString("sk-SK")} km`} />
        </div>

        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-bold text-gray-900">Majiteľ a evidencia</h3>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Klient</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <InfoBox label="MAJITEĽ" value={vehicle.customer ? `${vehicle.customer.first_name} ${vehicle.customer.last_name}` : "-"} />
          <InfoBox label="KONTAKT" value={vehicle.customer?.phone || vehicle.customer?.email || "-"} />
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <InfoBox label="POČET ZÁZNAMOV" value={records.length.toString()} highlight />
          <InfoBox label="POSLEDNÝ SERVIS" value={lastServiceDate} highlight />
          <InfoBox label="NAJBLIŽŠIA KONTROLA" value="-" highlight />
          <InfoBox label="SPOLU NÁKLADY" value={`${totalCost.toFixed(2).replace(".", ",")} €`} highlight />
        </div>

        <div className="bg-gray-50 border-l-4 border-gray-900 p-4 rounded-r-md text-sm text-gray-700 leading-relaxed mt-12">
          Vozidlo je evidované s pravidelným servisným intervalom a všetky nižšie uvedené zásahy boli
          zapísané ako vykonané servisné úkony v systéme autoservisu.
        </div>

        <div className="absolute bottom-[15mm] left-[20mm] right-[20mm] flex justify-between items-center text-xs text-gray-400 border-t border-gray-200 pt-4">
          <span>Autoservis Bartalos · Online servisná knižka</span>
          <span>1 / {records.length + 1}</span>
        </div>
      </div>

      {/* STRANY SO ZÁZNAMAMI */}
      {records.map((record, index) => (
        <div key={record.id} className="a4-page page-break">
          <div className="pdf-header mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Servisný záznam</h1>
              <div className="text-sm text-gray-500">Detail vykonaného servisného úkonu.</div>
            </div>
            <div className="text-right text-sm text-gray-600">
              <div className="font-bold text-gray-900 text-base">Záznam č. {(records.length - index).toString().padStart(2, '0')}</div>
              <div className="text-xs">Interné ID: SRV-{record.id.slice(0,8)}</div>
              <div className="text-xs">Stav vozidla: {record.mileage_at_service.toLocaleString("sk-SK")} km</div>
            </div>
          </div>

          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="inline-block bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
                {record.service_type}
              </span>
              <h2 className="text-2xl font-bold text-gray-900">{record.title}</h2>
              <div className="text-gray-500 mt-1">
                Dátum vykonania: {new Date(record.date).toLocaleDateString("sk-SK")}
              </div>
            </div>
            {record.next_service_km || record.next_service_date ? (
              <div className="text-right">
                <div className="text-xs text-gray-500">Ďalšia odporúčaná kontrola</div>
                <div className="font-bold text-gray-900">
                  {record.next_service_date && new Date(record.next_service_date).toLocaleDateString("sk-SK")}
                  {record.next_service_date && record.next_service_km && " / "}
                  {record.next_service_km && `${record.next_service_km.toLocaleString("sk-SK")} km`}
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <PriceBox label="CENA SPOLU" value={`${(record.price || 0).toFixed(2).replace(".", ",")} €`} />
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden mb-8">
            <div className="bg-gray-100 px-6 py-3 border-b border-gray-200 font-bold text-gray-900">
              Vykonané úkony
            </div>
            <div className="p-6 text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
              {record.description}
            </div>
          </div>

          {record.parts_replaced && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden mb-8">
              <div className="bg-gray-100 px-6 py-3 border-b border-gray-200 font-bold text-gray-900">
                Vymenené diely
              </div>
              <div className="p-6 text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
                {record.parts_replaced}
              </div>
            </div>
          )}

          {record.technician && (
            <div className="bg-orange-50 rounded-xl border border-orange-200 overflow-hidden mb-8">
              <div className="px-6 py-4 text-orange-900 text-sm leading-relaxed font-medium">
                <span className="font-bold mr-2">Poznámka technika ({record.technician}):</span>
                {record.technician}
              </div>
            </div>
          )}

          <div className="absolute bottom-[15mm] left-[20mm] right-[20mm] flex justify-between items-center text-xs text-gray-400 border-t border-gray-200 pt-4">
            <span>{vehicle.make} {vehicle.model} · {vehicle.plate}</span>
            <span>{index + 2} / {records.length + 1}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoBox({ label, value, className = "", highlight = false }: { label: string; value: string; className?: string; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border ${highlight ? 'bg-orange-50/50 border-orange-200' : 'border-gray-200'} ${className}`}>
      <div className={`text-xs font-semibold uppercase tracking-widest mb-2 ${highlight ? 'text-orange-600/80' : 'text-gray-400'}`}>
        {label}
      </div>
      <div className={`text-lg font-medium ${highlight ? 'text-gray-900 font-bold' : 'text-gray-900'}`}>
        {value}
      </div>
    </div>
  );
}

function PriceBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
