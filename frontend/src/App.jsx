// src/App.jsx
import React, { useState } from "react";
import Sidebar from "./components/Sidebar";

import ClientesPage from "./pages/ClientesPage";
import RecibosPage from "./pages/RecibosPage";
import RutasPage from "./pages/RutasPage";
import EstimadosPage from "./pages/EstimadosPage";
import BackupsPage from "./pages/BackupsPage"; // 👈 IMPORT

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
      case "estimados":
        return <EstimadosPage />;
      case "backups":                  // 👈 tiene que ser EXACTAMENTE esto
        return <BackupsPage />;
      default:
        return <ClientesPage />;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onChangePage={setActivePage} />
      <main className="app-main">{renderPage()}</main>
    </div>
  );
};

export default App;
