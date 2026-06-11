// src/components/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";

const ICONS = {
  clientes: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  recibos: "M7 3h10a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2 M10 8h6 M10 12h6 M10 16h3",
  rutas: "M4 19V5a2 2 0 0 1 2-2h11l3 3v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 M8 7h7 M8 11h8 M8 15h5",
  facturas: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h5",
  "rutas-hojas": "M3 7h18 M6 3v4 M18 3v4 M5 11h14v10H5z M8 15h4 M8 18h7",
  estimados: "M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6",
  proposals: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2 M8 8h8 M8 12h8 M8 16h5",
  backups: "M12 3a9 9 0 1 0 9 9h-4 M21 3v6h-6 M12 7v5l3 2",
  menu: "M4 6h16 M4 12h16 M4 18h16",
  sun: "M12 4V2 M12 22v-2 M4.93 4.93 3.51 3.51 M20.49 20.49l-1.42-1.42 M4 12H2 M22 12h-2 M4.93 19.07l-1.42 1.42 M20.49 3.51l-1.42 1.42 M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  moon: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79",
  language: "M3 5h12 M9 3v2 M10 5c-.7 4.2-3.1 7.2-7 9 M5 9c1.4 2.4 3.6 4.2 6 5 M14 21l4-9 4 9 M15.5 18h5",
};

const Icon = ({ name }) => (
  <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d={ICONS[name]} />
  </svg>
);

const Sidebar = ({ activePage, onChangePage }) => {
  const { lang, setLang } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
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

  const items = [
    { id: "clientes", label: t(lang, "clientes"), icon: "clientes" },
    { id: "recibos", label: t(lang, "recibos"), icon: "recibos" },
    { id: "rutas", label: t(lang, "rutas"), icon: "rutas" },
    { id: "facturas", label: t(lang, "facturas"), icon: "facturas" },
    { id: "rutas-hojas", label: t(lang, "rutas_hojas"), icon: "rutas-hojas" },
    { id: "estimados", label: t(lang, "estimados"), icon: "estimados" },
    { id: "proposals", label: t(lang, "proposals"), icon: "proposals" },
    { id: "backups", label: t(lang, "backups"), icon: "backups" },
  ];

  const activeItem = items.find((item) => item.id === activePage);
  const activeLabel = activeItem?.label || t(lang, "menu");

  const handlePageChange = (pageId) => {
    onChangePage(pageId);
    setMenuOpen(false);
  };

  return (
    <aside className={"sidebar" + (menuOpen ? " sidebar--open" : "")}>
      <div className="sidebar-header">
        <img src="/logo.jpg" alt="Logo" className="sidebar-logo-img" />
        <div>
          <h1 className="sidebar-title">{t(lang, "appName")}</h1>
          <p className="sidebar-subtitle">{t(lang, "version")}</p>
        </div>
      </div>

      <button
        type="button"
        className="sidebar-menu-button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
      >
        <span className="sidebar-menu-current">
          <Icon name={activeItem?.icon || "menu"} />
          {activeLabel}
        </span>
        <span className="sidebar-menu-chevron">{menuOpen ? "▲" : "▼"}</span>
      </button>

      <nav className={`sidebar-nav ${menuOpen ? "sidebar-nav--open" : ""}`}>
        {items.map((item) => (
          <button
            key={item.id}
            className={
              "sidebar-link" +
              (activePage === item.id ? " sidebar-link--active" : "")
            }
            onClick={() => handlePageChange(item.id)}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="sidebar-toggle-btn"
          onClick={() => setDarkMode((d) => !d)}
          title={darkMode ? t(lang, "light") : t(lang, "dark")}
        >
          <Icon name={darkMode ? "sun" : "moon"} />
          <span>{darkMode ? t(lang, "light") : t(lang, "dark")}</span>
        </button>
        <button
          className="sidebar-toggle-btn"
          onClick={() => setLang(lang === "es" ? "en" : "es")}
          title={lang === "es" ? "Switch to English" : "Cambiar a Español"}
        >
          <Icon name="language" />
          <span>{lang === "es" ? "EN" : "ES"}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
