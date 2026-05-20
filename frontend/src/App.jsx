// src/App.jsx
import React, { useState } from "react";
import { LanguageProvider } from "./i18n/LanguageContext";
import Sidebar from "./components/Sidebar";
import ErrorBoundary from "./components/ErrorBoundary";

import ClientesPage from "./pages/ClientesPage";
import RecibosPage from "./pages/RecibosPage";
import RutasPage from "./pages/RutasPage";
import EstimadosPage from "./pages/EstimadosPage";
import ProposalsPage from "./pages/ProposalsPage";
import BackupsPage from "./pages/BackupsPage";
import InvoicePage from "./pages/InvoicePage";
import RouteSheetPage from "./pages/RouteSheetPage";

const App = () => {
  const [activePage, setActivePage] = useState("clientes");

  const renderPage = () => {
    switch (activePage) {
      case "clientes":
        return <ClientesPage />;
      case "recibos":
        return <RecibosPage />;
      case "rutas":
        return <RutasPage />;
      case "facturas":
        return <InvoicePage />;
      case "rutas-hojas":
        return <RouteSheetPage />;
      case "estimados":
        return <EstimadosPage />;
      case "proposals":
        return <ProposalsPage />;
      case "backups":
        return <BackupsPage />;
      default:
        return <ClientesPage />;
    }
  };

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <div className="app-shell">
          <Sidebar activePage={activePage} onChangePage={setActivePage} />
          <main className="app-main">{renderPage()}</main>
        </div>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

export default App;
