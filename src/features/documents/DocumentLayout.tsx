import React from "react";
import { useSuspenseQuery } from "@tanstack/react-query";

// Nastavenia firmy sa používajú na každom dokumente
export const companySettingsQuery = () => ({
  queryKey: ["companySettings"],
  queryFn: async () => {
    if (!window.electronAPI) return null;
    return window.electronAPI.db.getCompanySettings();
  },
});

type DocumentLayoutProps = {
  documentTitle: string;
  documentNumber?: string;
  children: React.ReactNode;
};

export function DocumentLayout({
  documentTitle,
  documentNumber,
  children,
}: DocumentLayoutProps) {
  const { data: settings } = useSuspenseQuery(companySettingsQuery());

  return (
    <main className="document-page mx-auto bg-white p-8 relative">
      <header className="document-header flex justify-between items-start mb-10 pb-6 border-b border-gray-200">
        <section className="flex items-center gap-4">
          {settings?.logo_path ? (
            <img
              src={`app-photo://settings/${settings.logo_path}`}
              alt={settings.company_name}
              className="h-16 w-auto object-contain"
            />
          ) : (
            <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 font-bold text-xl">
              LOGO
            </div>
          )}
          <div className="text-sm">
            <h1 className="text-xl font-bold text-gray-900 mb-1">{settings?.company_name || "Autoservis"}</h1>
            <p className="text-gray-600">
              {settings?.street}, {settings?.postal_code} {settings?.city}
            </p>
            <p className="text-gray-600 mt-1">
              {settings?.ico && `IČO: ${settings.ico} • `}
              {settings?.dic && `DIČ: ${settings.dic} • `}
              {settings?.phone}
            </p>
          </div>
        </section>

        <section className="document-title text-right">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wider">{documentTitle}</h2>
          {documentNumber && <p className="text-lg font-medium text-gray-600 mt-1">Číslo: {documentNumber}</p>}
        </section>
      </header>

      <div className="document-content min-h-[700px]">
        {children}
      </div>

      <footer className="document-footer mt-12 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-500 avoid-break">
        <span>{settings?.company_name || "Autoservis"}</span>
        <span>Vygenerované: {new Date().toLocaleDateString("sk-SK")}</span>
      </footer>
    </main>
  );
}
