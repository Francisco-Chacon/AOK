import React, { useState, useEffect, Suspense, lazy } from "react";
import { LanguageProvider, useLanguage } from "./i18n/LanguageContext";
import Sidebar, { MobileBottomNav } from "./components/Sidebar";
import Topbar from "./components/Topbar";
import StatusBar from "./components/StatusBar";
import ErrorBoundary from "./components/ErrorBoundary";
import SettingsModal from "./components/SettingsModal";
import AiPanel from "./components/AiPanel";
import { ToastProvider } from "./components/Toast";
import { cn } from "./utils/cn";

const ClientesPage = lazy(() => import("./pages/ClientesPage"));
const EstimadosPage = lazy(() => import("./pages/EstimadosPage"));
const ProposalsPage = lazy(() => import("./pages/ProposalsPage"));
const ContractsPage = lazy(() => import("./pages/ContractsPage"));
const BackupsPage = lazy(() => import("./pages/BackupsPage"));
const InvoicePage = lazy(() => import("./pages/InvoicePage"));
const RouteSheetPage = lazy(() => import("./pages/RouteSheetPage"));

const PageFallback = () => (
  <div className="flex min-h-[400px] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--accent-primary)] border-t-transparent" />
  </div>
);

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
};

const AppContent = () => {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [activePage, setActivePage] = useState("facturas");
  const [aiOpen, setAiOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const { lang, setLang } = useLanguage();

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case "clientes": return <ClientesPage />;
      case "facturas": return <InvoicePage />;
      case "rutas-hojas": return <RouteSheetPage />;
      case "estimados": return <EstimadosPage />;
      case "proposals": return <ProposalsPage />;
      case "contracts": return <ContractsPage />;
      case "backups": return <BackupsPage />;
      default: return <InvoicePage />;
    }
  };

  return (
    <div className={cn("app-shell grid h-screen overflow-hidden", isMobile ? "grid-cols-[1fr]" : "grid-cols-[220px_minmax(0,1fr)]", aiOpen && !isMobile && "app-shell--ai-open grid-cols-[220px_minmax(0,1fr)_340px]")}>
      {!isMobile && <Sidebar activePage={activePage} onChangePage={setActivePage} />}

      <div className="app-main-wrapper flex min-h-0 flex-col overflow-hidden">
        <Topbar
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode((d) => !d)}
          lang={lang}
          onToggleLang={() => setLang(lang === "es" ? "en" : "es")}
          online={online}
          onOpenAi={() => setAiOpen((v) => !v)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <main className={cn("app-main min-h-0 flex-1 overflow-y-auto px-6 py-7", isMobile && "pb-24")} style={{ animation: "fadeIn 0.25s ease-out" }}><Suspense fallback={<PageFallback />}>{renderPage()}</Suspense></main>
        <StatusBar online={online} aiConnected={online} />
      </div>

      {isMobile && (
        <MobileBottomNav
          activePage={activePage}
          onChangePage={setActivePage}
          lang={lang}
        />
      )}

      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} />
      )}
      {aiOpen && (
        <AiPanel onClose={() => setAiOpen(false)} online={online} />
      )}
    </div>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

export default App;
