import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { DocumentLayout, companySettingsQuery } from "@/features/documents/DocumentLayout";
import { formatCurrency, formatIco, formatIban, formatDate } from "@/features/documents/documentFormatters";

export const Route = createFileRoute("/print/invoice/$invoiceId")({
  loader: async ({ params, context }) => {
    // We should prefetch the invoice data
    return {};
  },
  component: InvoicePrint,
});

const invoiceQuery = (invoiceId: string) => ({
  queryKey: ["invoice", invoiceId],
  queryFn: async () => {
    if (!window.electronAPI) return null;
    return window.electronAPI.db.getInvoiceById(invoiceId);
  },
});

function InvoicePrint() {
  const { invoiceId } = Route.useParams();
  const { data: invoice } = useSuspenseQuery(invoiceQuery(invoiceId));
  const { data: settings } = useSuspenseQuery(companySettingsQuery());

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("document-ready"));
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!invoice) {
    return <div className="p-8 text-red-500">Faktúra sa nenašla.</div>;
  }

  // Pre existujúcu (vydanú) faktúru by sme mali ideálne brať dáta zo snapshot_json, 
  // ale pre tento prototyp zoberieme priamo dáta z DB.
  // Ak je faktúra issued, môžeme parsovať snapshot.
  
  let data = null;
  if (invoice.status === "issued" && invoice.snapshot_json) {
    try {
      data = JSON.parse(invoice.snapshot_json);
    } catch (e) {
      console.error("Failed to parse invoice snapshot", e);
    }
  }

  // Ak nemáme snapshot (draft), budeme potrebovať aj vozidlo a zákazníka (na to by sme mali urobiť queries).
  // Pre zjednodušenie tohto prototypu predpokladáme, že invoice.customer_id atď máme, 
  // v reálnej apke tu dáme useSuspenseQuery aj na zákazníka.
  // Keďže v požiadavke je povedané, že faktúra sa exportuje AŽ PO vydaní, 
  // predpokladajme, že zväčša budeme mať snapshot.
  
  const customer = data?.customer || { fullName: "Zákazník zatiaľ nenahraný" };
  const items = data?.items || invoice.items || [];
  
  const isDraft = invoice.status === "draft";
  const documentTitle = isDraft ? "Fakturačný podklad (Koncept)" : "Faktúra";
  const documentNumber = isDraft ? undefined : invoice.invoice_number;

  return (
    <DocumentLayout 
      documentTitle={documentTitle} 
      documentNumber={documentNumber}
    >
      <div className="grid grid-cols-2 gap-8 mb-10 text-sm">
        {/* Dodávateľ - predvyplnené z DocumentLayout, ale sem dáme presné fakturačné údaje */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-bold text-gray-500 uppercase tracking-wider mb-2 text-xs">Dodávateľ</h3>
          <p className="font-bold text-lg">{settings?.company_name}</p>
          <p>{settings?.street}</p>
          <p>{settings?.postal_code} {settings?.city}</p>
          <p>{settings?.country}</p>
          
          <div className="mt-3 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1">
            <span className="text-gray-500">IČO:</span> <span>{formatIco(settings?.ico)}</span>
            <span className="text-gray-500">DIČ:</span> <span>{settings?.dic}</span>
            <span className="text-gray-500">IČ DPH:</span> <span>{settings?.ic_dph}</span>
          </div>
          
          <div className="mt-3">
            <p className="font-semibold mb-1">Bankové spojenie:</p>
            <p>Banka: {settings?.bank_name}</p>
            <p>IBAN: {formatIban(settings?.iban)}</p>
            <p>SWIFT: {settings?.bic_swift}</p>
          </div>
        </div>

        {/* Odberateľ */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="font-bold text-gray-500 uppercase tracking-wider mb-2 text-xs">Odberateľ</h3>
          <p className="font-bold text-lg">{customer.first_name || customer.fullName} {customer.last_name}</p>
          {(customer.street || customer.address) && <p>{customer.street || customer.address}</p>}
          {(customer.city) && <p>{customer.postal_code} {customer.city}</p>}
          
          <div className="mt-3 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1">
            {customer.ico && <><span className="text-gray-500">IČO:</span> <span>{formatIco(customer.ico)}</span></>}
            {customer.dic && <><span className="text-gray-500">DIČ:</span> <span>{customer.dic}</span></>}
            {customer.ic_dph && <><span className="text-gray-500">IČ DPH:</span> <span>{customer.ic_dph}</span></>}
          </div>
        </div>
      </div>

      {/* Dátumy */}
      <div className="flex gap-12 mb-8 text-sm">
        <div>
          <span className="block text-gray-500 font-medium">Dátum vystavenia</span>
          <span className="font-bold">{formatDate(invoice.invoice_date)}</span>
        </div>
        <div>
          <span className="block text-gray-500 font-medium">Dátum splatnosti</span>
          <span className="font-bold text-red-600">{formatDate(invoice.due_date)}</span>
        </div>
        <div>
          <span className="block text-gray-500 font-medium">Spôsob úhrady</span>
          <span className="font-bold">
            {invoice.payment_method === 'bank_transfer' ? 'Prevodom na účet' : 'V hotovosti'}
          </span>
        </div>
      </div>

      {/* Položky */}
      <table className="w-full text-sm text-left mb-8">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="py-2 px-3 rounded-tl">Popis položky</th>
            <th className="py-2 px-3 text-right">Množstvo</th>
            <th className="py-2 px-3 text-right">Jednotka</th>
            <th className="py-2 px-3 text-right">Cena bez DPH</th>
            {settings?.vat_payer === 1 && <th className="py-2 px-3 text-right">DPH %</th>}
            <th className="py-2 px-3 text-right rounded-tr">Spolu s DPH</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map((item: any, idx: number) => (
            <tr key={item.id || idx}>
              <td className="py-3 px-3">
                <p className="font-medium">{item.name}</p>
                {item.description && <p className="text-xs text-gray-500 mt-1">{item.description}</p>}
              </td>
              <td className="py-3 px-3 text-right">{item.quantity}</td>
              <td className="py-3 px-3 text-right">{item.unit}</td>
              <td className="py-3 px-3 text-right">{formatCurrency(item.unit_price_without_vat)}</td>
              {settings?.vat_payer === 1 && <td className="py-3 px-3 text-right">{item.vat_rate}%</td>}
              <td className="py-3 px-3 text-right font-medium">{formatCurrency(item.line_total_with_vat)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Sumár */}
      <div className="flex justify-end mb-12">
        <div className="w-1/2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-right text-gray-600">Celkom bez DPH:</div>
            <div className="text-right">{formatCurrency(invoice.subtotal)}</div>
            
            {settings?.vat_payer === 1 && (
              <>
                <div className="text-right text-gray-600">Suma DPH:</div>
                <div className="text-right">{formatCurrency(invoice.vat_amount)}</div>
              </>
            )}
            
            <div className="col-span-2 border-b border-gray-300 my-1"></div>
            
            <div className="text-right font-bold text-lg">Celkom k úhrade:</div>
            <div className="text-right font-bold text-lg">{formatCurrency(invoice.total_amount)}</div>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="text-sm">
          <p className="font-bold mb-1">Poznámka:</p>
          <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}
      
      {/* Pečiatka */}
      <div className="mt-20 flex justify-end">
        <div className="w-64 text-center">
          <div className="border-b border-gray-400 pb-1 h-20 mb-2 flex items-end justify-center">
            {/* Priestor pre pečiatku a podpis */}
          </div>
          <p className="text-xs text-gray-500">Pečiatka a podpis</p>
        </div>
      </div>
    </DocumentLayout>
  );
}
