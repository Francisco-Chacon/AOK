import React, { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";
import { cn } from "../utils/cn";

const ICONS = {
  clientes: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  facturas: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h5",
  "rutas-hojas": "M3 7h18 M6 3v4 M18 3v4 M5 11h14v10H5z M8 15h4 M8 18h7",
  estimados: "M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6",
  proposals: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2 M8 8h8 M8 12h8 M8 16h5",
  backups: "M12 3a9 9 0 1 0 9 9h-4 M21 3v6h-6 M12 7v5l3 2",
};

const Icon = ({ name }) => (
  <svg className="sidebar-icon h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={ICONS[name]} />
  </svg>
);

const NAV_ITEMS = [
  { id: "clientes", icon: "clientes", labelKey: "clientes" },
  { id: "facturas", icon: "facturas", labelKey: "facturas" },
  { id: "rutas-hojas", icon: "rutas-hojas", labelKey: "rutas_hojas" },
  { id: "estimados", icon: "estimados", labelKey: "estimados" },
  { id: "proposals", icon: "proposals", labelKey: "proposals" },
  { id: "backups", icon: "backups", labelKey: "backups" },
];

const Sidebar = ({ activePage, onChangePage }) => {
  const { lang } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const handlePageChange = (pageId) => {
    onChangePage(pageId);
    setMenuOpen(false);
  };

  return (
    <aside className={cn("sidebar flex h-screen w-[220px] shrink-0 flex-col border-r border-white/10 bg-[var(--bg-sidebar)] text-white", menuOpen && "sidebar--open")}>
      <div className="sidebar-header flex items-center gap-3 border-b border-white/10 px-4 py-4">
        <img src="/logo.png" alt="Logo" className="sidebar-logo-img h-10 w-10 rounded-xl object-contain" />
        <div>
          <div className="text-sm font-bold leading-tight">{t(lang, "appName")}</div>
          <div className="text-xs text-white/55">{t(lang, "version")}</div>
        </div>
      </div>

      <nav className={cn("sidebar-nav flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4", menuOpen && "sidebar-nav--open")}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            title={t(lang, item.labelKey)}
            className={cn(
              "sidebar-link flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white",
              activePage === item.id && "sidebar-link--active bg-white/15 text-white shadow-sm"
            )}
            onClick={() => handlePageChange(item.id)}
          >
            <Icon name={item.icon} />
            <span>{t(lang, item.labelKey)}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer border-t border-white/10 px-4 py-3 text-xs text-white/45">
        <div>
          <span>v1.0</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
