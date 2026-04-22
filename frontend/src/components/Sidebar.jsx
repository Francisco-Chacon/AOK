// src/components/Sidebar.jsx
import React, { useState, useEffect } from "react";

const Sidebar = ({ activePage, onChangePage }) => {
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
    { id: "clientes", label: "Clientes" },
    { id: "recibos", label: "Recibos" },
    { id: "rutas", label: "Rutas" },
    { id: "estimados", label: "Estimados" },
    { id: "backups", label: "Backups" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src="/logo.jpg" alt="Logo" className="sidebar-logo-img" />
        <div>
          <h1 className="sidebar-title">Sistema de Gestión</h1>
          <p className="sidebar-subtitle">Versión 1.0</p>
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
          className="sidebar-theme-toggle"
          onClick={() => setDarkMode((d) => !d)}
          title={darkMode ? "Modo claro" : "Modo oscuro"}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
