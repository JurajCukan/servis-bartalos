import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardHeader } from "@/components/garage/DashboardHeader";
import { FileText, Plus } from "lucide-react";
import { formatCurrency, formatDate } from "@/features/documents/documentFormatters";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/invoices/")({
  component: InvoicesPage,
});

const invoicesQuery = () => ({
  queryKey: ["invoices"],
  queryFn: async () => {
    if (!window.electronAPI) return [];
    return window.electronAPI.db.getAllInvoices();
  },
});

function InvoicesPage() {
  const { data: invoices, isLoading } = useQuery(invoicesQuery());

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title="Faktúry">
        <button
          className="inline-flex items-center gap-2 rounded-md bg-brand-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-accent-hover"
          onClick={() => alert("Pridávanie faktúr bude implementované v ďalšom kroku.")}
        >
          <Plus className="h-4 w-4" />
          Nová faktúra
        </button>
      </DashboardHeader>

      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-6 rounded-xl border border-brand-border bg-brand-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-brand-fg">
                <thead className="border-b border-brand-border bg-brand-bg text-xs uppercase text-brand-fg-muted">
                  <tr>
                    <th className="px-6 py-4 font-medium">Číslo</th>
                    <th className="px-6 py-4 font-medium">Zákazník</th>
                    <th className="px-6 py-4 font-medium">Dátum vystavenia</th>
                    <th className="px-6 py-4 font-medium">Suma</th>
                    <th className="px-6 py-4 font-medium">Stav</th>
                    <th className="px-6 py-4 font-medium text-right">Akcie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-brand-fg-muted">
                        Načítavam faktúry...
                      </td>
                    </tr>
                  ) : invoices && invoices.length > 0 ? (
                    invoices.map((invoice: any) => (
                      <tr key={invoice.id} className="hover:bg-brand-bg transition-colors">
                        <td className="px-6 py-4 font-medium">{invoice.invoice_number}</td>
                        <td className="px-6 py-4">
                          {invoice.c_first_name} {invoice.c_last_name}
                        </td>
                        <td className="px-6 py-4">{formatDate(invoice.invoice_date)}</td>
                        <td className="px-6 py-4 font-medium">{formatCurrency(invoice.total_amount)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            invoice.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                            invoice.status === 'issued' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {invoice.status === 'draft' ? 'Koncept' :
                             invoice.status === 'issued' ? 'Vystavená' : 'Uhradená'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={async () => {
                              try {
                                if (!window.electronAPI) return;
                                const result = await window.electronAPI.documents.generatePdf({
                                  route: `/print/invoice/${invoice.id}`,
                                  filename: `${invoice.invoice_number}`
                                });
                                if (!result.canceled && result.filePath) {
                                  window.electronAPI.documents.revealPdf(result.filePath);
                                }
                              } catch (error) {
                                console.error("Chyba pri generovaní PDF:", error);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-brand-accent hover:text-brand-accent-hover font-medium"
                          >
                            <FileText className="h-4 w-4" />
                            PDF
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-brand-fg-muted">
                        <div className="flex flex-col items-center justify-center">
                          <FileText className="h-10 w-10 text-brand-border mb-3" />
                          <p>Zatiaľ nemáte žiadne faktúry.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
