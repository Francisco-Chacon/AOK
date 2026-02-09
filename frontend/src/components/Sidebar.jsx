// src/components/Sidebar.jsx
import React from "react";

const Sidebar = ({ activePage, onChangePage }) => {
const items = [
  { id: "clientes", label: "Clientes" },
  { id: "recibos", label: "Recibos" },
  { id: "rutas", label: "Rutas" },
  { id: "estimados", label: "Estimados" },
  { id: "backups", label: "Backups" }, // 👈 este
];


  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">●</span>
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
    </aside>
  );
};

export default Sidebar;
