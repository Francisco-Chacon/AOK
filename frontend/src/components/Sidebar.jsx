import React, { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";
import { cn } from "../utils/cn";
import Modal from "./Modal";

const ICONS = {
  clientes: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  facturas: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h5",
  "rutas-hojas": "M3 7h18 M6 3v4 M18 3v4 M5 11h14v10H5z M8 15h4 M8 18h7",
  estimados: "M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6",
  proposals: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2 M8 8h8 M8 12h8 M8 16h5",
  contracts: "M8 2v4 M16 2v4 M3 10h18 M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z M8 14h.01 M12 14h.01 M16 14h.01 M8 18h.01 M12 18h.01 M16 18h.01",
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
  { id: "contracts", icon: "contracts", labelKey: "contracts" },
  { id: "backups", icon: "backups", labelKey: "backups" },
];

const Sidebar = ({ activePage, onChangePage }) => {
  const { lang } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const handlePageChange = (pageId) => {
    onChangePage(pageId);
    setMenuOpen(false);
  };

  return (
    <>
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

        <div className="sidebar-footer border-t border-white/10 px-3 py-3">
          <button
            onClick={() => setSupportOpen(true)}
            className="sidebar-link flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4 M12 8h.01" />
            </svg>
            <span className="flex-1">{t(lang, "support_title")}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <div className="mt-2 px-3 text-[10px] text-white/30">v1.0</div>
        </div>
      </aside>

      <Modal open={supportOpen} onClose={() => setSupportOpen(false)}>
        <div className="support-card">
          <button className="support-card-close" onClick={() => setSupportOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18 M6 6l12 12" />
            </svg>
          </button>
          <div className="support-card-top">
            <div className="support-card-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h2>Francisco Chacón</h2>
            <p className="support-card-role">{t(lang, "support_developer")}</p>
          </div>

          <div className="support-card-divider" />

          <div className="support-card-body">
            <a href="tel:+50372044924" className="support-card-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <div>
                <span className="support-card-label">{t(lang, "support_phone")}</span>
                <span className="support-card-value">+503 7204-4924</span>
              </div>
            </a>

            <a href="mailto:francochacon155@gmail.com" className="support-card-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <div>
                <span className="support-card-label">{t(lang, "support_email")}</span>
                <span className="support-card-value">francochacon155@gmail.com</span>
              </div>
            </a>

            <div className="support-card-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <div>
                <span className="support-card-label">{t(lang, "support_location")}</span>
                <span className="support-card-value">El Salvador</span>
              </div>
            </div>
          </div>

          <div className="support-card-tagline">
            {t(lang, "support_tagline")}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Sidebar;
