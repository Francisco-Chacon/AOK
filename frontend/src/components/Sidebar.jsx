// src/components/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";

const Sidebar = ({ activePage, onChangePage }) => {
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

  const items = [
    { id: "clientes", label: t(lang, "clientes") },
    { id: "recibos", label: t(lang, "recibos") },
    { id: "rutas", label: t(lang, "rutas") },
    { id: "estimados", label: t(lang, "estimados") },
    { id: "backups", label: t(lang, "backups") },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src="/logo.jpg" alt="Logo" className="sidebar-logo-img" />
        <div>
          <h1 className="sidebar-title">{t(lang, "appName")}</h1>
          <p className="sidebar-subtitle">{t(lang, "version")}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            key={item.id}
            className={
              "sidebar-link" +
              (activePage === item.id ? " sidebar-link--active" : "")
            }
            onClick={() => onChangePage(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="sidebar-toggle-btn"
          onClick={() => setDarkMode((d) => !d)}
          title={darkMode ? t(lang, "light") : t(lang, "dark")}
        >
          {darkMode ? "☀️" : "🌙"}
          <span>{darkMode ? t(lang, "light") : t(lang, "dark")}</span>
        </button>
        <button
          className="sidebar-toggle-btn"
          onClick={() => setLang(lang === "es" ? "en" : "es")}
          title={lang === "es" ? "Switch to English" : "Cambiar a Español"}
        >
          {lang === "es" ? "🇺🇸 EN" : "🇪🇸 ES"}
          <span>{lang === "es" ? "EN" : "ES"}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
