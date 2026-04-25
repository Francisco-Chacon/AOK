// src/pages/EstimadosPage.jsx
import React, { useEffect, useState } from "react";
import api from "../api/apiClient";
import Modal from "../components/Modal";
import SearchableSelect from "../components/SearchableSelect";
import { useLanguage } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";

const EstimadosPage = () => {
  const { lang } = useLanguage();
  const [estimados, setEstimados] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filterEstado, setFilterEstado] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEstimado, setEditingEstimado] = useState(null);
  const [form, setForm] = useState({
    cliente_id: "",
    direccion_trabajo: "",
    fecha: new Date().toISOString().slice(0, 10),
    monto: "",
    moneda: "USD",
    descripcion_trabajo: "",
    estado: "borrador",
  });

  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({
    descripcion: "",
    cantidad: 1,
    precio_unitario: "",
  });

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [estimadoToDelete, setEstimadoToDelete] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [estimadoDetalle, setEstimadoDetalle] = useState(null);

  const [statementOpen, setStatementOpen] = useState(false);
  const [estimadoStatement, setEstimadoStatement] = useState(null);

  const [viewMode, setViewMode] = useState("list"); // "list" | "statement"

  const loadData = async () => {
    setLoading(true);

    try {
      const resClientes = await api.get("/clientes");
      setClientes(resClientes.data || []);
    } catch (err) {
      console.error("Error cargando clientes", err);
    }

    try {
      const resEstimados = await api.get("/estimados");
      setEstimados(resEstimados.data || []);
    } catch (err) {
      console.error("Error cargando estimados", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewModal = () => {
    setEditingEstimado(null);
    setForm({
      cliente_id: "",
      direccion_trabajo: "",
      fecha: new Date().toISOString().slice(0, 10),
      monto: "",
      moneda: "USD",
      descripcion_trabajo: "",
      estado: "borrador",
    });
    setItems([]);
    setNewItem({ descripcion: "", cantidad: 1, precio_unitario: "" });
    setModalOpen(true);
  };

  const openEditModal = (e) => {
    setEditingEstimado(e);
    setForm({
      cliente_id: e.cliente_id || "",
      direccion_trabajo: e.direccion_trabajo || "",
      fecha: (e.fecha || "").slice(0, 10),
      monto: e.monto || "",
      moneda: e.moneda || "USD",
      descripcion_trabajo: e.notas_adicionales || "",
      estado: e.estado || "borrador",
    });
    const itemsArray = getItemsFromDescripcion(e.descripcion_trabajo, e.monto, e.moneda).map(item => ({
      ...item,
      total: item.cantidad * item.precio_unitario,
    }));
    setItems(itemsArray);
    setNewItem({ descripcion: "", cantidad: 1, precio_unitario: "" });
    setModalOpen(true);
  };

  const openDetails = (e) => {
    setEstimadoDetalle(e);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setEstimadoDetalle(null);
  };

  const openStatement = (e) => {
    setEstimadoStatement(e);
    setStatementOpen(true);
  };

  const closeStatement = () => {
    setStatementOpen(false);
    setEstimadoStatement(null);
  };

  const printStatement = (estimado) => {
    const items = getItemsFromDescripcion(estimado.descripcion_trabajo, estimado.monto, estimado.moneda);
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Statement - ${estimado.cliente_nombre || "Cliente"}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    .header { display: flex; align-items: center; gap: 20px; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { width: 80px; height: auto; }
    .brand h1 { font-size: 24px; margin-bottom: 4px; }
    .brand p { font-size: 14px; color: #666; }
    .cliente-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .cliente-name { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
    .cliente-dir { font-size: 14px; color: #666; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-soft { background: #f3f4f6; color: #374151; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th, td { border: 1px solid #ddd; padding: 10px 12px; text-align: left; }
    th { background: #f9fafb; font-weight: 600; }
    .total-row td { font-weight: bold; text-align: right; }
    .notas { margin-top: 20px; }
    .notas-label { font-weight: bold; margin-bottom: 4px; }
    .footer { margin-top: 40px; border-top: 2px solid #333; padding-top: 20px; display: flex; justify-content: flex-end; }
    .grand-total { font-size: 18px; }
    .grand-total strong { margin-left: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <img src="${window.location.origin}/logo.jpg" alt="Logo" class="logo" />
    <div class="brand">
      <h1>Sistema de Gestión</h1>
      <p>Statement</p>
    </div>
  </div>

  <div class="cliente-header">
    <div>
      <div class="cliente-name">${estimado.cliente_nombre || "Cliente sin nombre"}</div>
      <div class="cliente-dir">${estimado.direccion_trabajo || "Sin dirección"}</div>
    </div>
    <span class="badge ${estimado.estado === "aceptado" ? "badge-success" : estimado.estado === "rechazado" ? "badge-warning" : "badge-soft"}">${estimado.estado}</span>
  </div>

  <table>
    <thead>
      <tr>
        <th>Descripción</th>
        <th>Cantidad</th>
        <th>Precio Unit.</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.length === 0 ? `<tr><td colspan="4" style="color:#999">Sin materiales.</td></tr>` : items.map(item => `
      <tr>
        <td>${item.descripcion}</td>
        <td>${item.cantidad}</td>
        <td>${estimado.moneda} ${Number(item.precio_unitario).toFixed(2)}</td>
        <td>${estimado.moneda} ${Number(item.cantidad * item.precio_unitario).toFixed(2)}</td>
      </tr>`).join("")}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="3">Total</td>
        <td>${estimado.moneda} ${Number(estimado.monto || 0).toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>

  ${estimado.notas_adicionales?.trim() ? `
  <div class="notas">
    <div class="notas-label">Notas Adicionales</div>
    <p>${estimado.notas_adicionales}</p>
  </div>` : ""}

  <div class="footer">
    <div class="grand-total">Total:<strong>${estimado.moneda} ${Number(estimado.monto || 0).toFixed(2)}</strong></div>
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`);
    printWindow.document.close();
  };

  const handleChange = (ev) => {
    const { name, value } = ev.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleNewItemChange = (ev) => {
    const { name, value } = ev.target;
    setNewItem((item) => ({ ...item, [name]: value }));
  };

  const addItem = () => {
    if (!newItem.descripcion || !newItem.precio_unitario) {
      alert("Por favor completa descripción y precio unitario");
      return;
    }
    const item = {
      ...newItem,
      cantidad: Number(newItem.cantidad) || 1,
      precio_unitario: Number(newItem.precio_unitario) || 0,
      total: (Number(newItem.cantidad) || 1) * (Number(newItem.precio_unitario) || 0),
    };
    setItems((prev) => [...prev, item]);
    setNewItem({ descripcion: "", cantidad: 1, precio_unitario: "" });
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + (item.total || 0), 0);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const total = calculateTotal();
    const descripcionItems = items.map((i) => `${i.cantidad}x ${i.descripcion} ($${i.precio_unitario} c/u)`).join("\n");
    const notasAdicionales = form.descripcion_trabajo || "";
    const payload = {
      cliente_id: form.cliente_id,
      direccion_trabajo: form.direccion_trabajo,
      fecha: form.fecha,
      monto: total,
      moneda: form.moneda,
      descripcion_trabajo: descripcionItems,
      notas_adicionales: notasAdicionales,
      estado: form.estado,
    };

    try {
      if (editingEstimado) {
        await api.put(`/estimados/${editingEstimado.id}`, payload);
      } else {
        await api.post("/estimados", payload);
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error guardando estimado", err);
      alert("No se pudo guardar el estimado.");
    }
  };

  const askDelete = (e) => {
    setEstimadoToDelete(e);
    setConfirmDeleteOpen(true);
  };

  const cancelDelete = () => {
    setConfirmDeleteOpen(false);
    setEstimadoToDelete(null);
  };

  const confirmDelete = async () => {
    if (!estimadoToDelete) return;
    try {
      await api.delete(`/estimados/${estimadoToDelete.id}`);
      await loadData();
    } catch (err) {
      console.error("Error eliminando estimado", err);
      alert("No se pudo eliminar el estimado.");
    } finally {
      setConfirmDeleteOpen(false);
      setEstimadoToDelete(null);
    }
  };

  const filtrados = estimados.filter((e) => {
    if (filterEstado !== "todos" && e.estado !== filterEstado) return false;
    if (!debouncedQuery) return true;
    const q = debouncedQuery.toLowerCase();
    return (
      (e.cliente_nombre || "").toLowerCase().includes(q) ||
      (e.direccion_trabajo || "").toLowerCase().includes(q) ||
      (e.descripcion_trabajo || "").toLowerCase().includes(q) ||
      (e.estado || "").toLowerCase().includes(q) ||
      String(e.monto || "").toLowerCase().includes(q)
    );
  });

  const totalEstimado = estimados.reduce(
    (acc, e) => acc + (e.monto || 0),
    0
  );

  const getToday = () => {
    const now = new Date();
    return now.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getItemsFromDescripcion = (descripcion, monto, moneda) => {
    if (!descripcion) return [];
    const lines = descripcion.split("\n").filter((line) => line.trim());
    return lines.map((line) => {
      const match = line.match(/^(\d+)x\s+(.+)\s+\(\$([\d.]+)\s+c\/u\)$/);
      if (match) {
        return {
          cantidad: parseInt(match[1]),
          descripcion: match[2],
          precio_unitario: parseFloat(match[3]),
        };
      }
      return {
        cantidad: 1,
        descripcion: line,
        precio_unitario: monto || 0,
      };
    });
  };

const renderStatementView = () => {
    return (
      <div className="statement-list">
        {filtrados.length === 0 ? (
          <p className="muted">No hay estimados registrados.</p>
        ) : (
          filtrados.map((e, idx) => {
            const items = getItemsFromDescripcion(e.descripcion_trabajo, e.monto, e.moneda);
            return (
            <div key={e.id} className="statement-item">
              <div className="statement-header">
                <div className="statement-logo-section">
                  <img src="/logo.jpg" alt="Logo" className="statement-logo-img" />
                  <div className="statement-brand">
                    <h1 className="statement-title">Sistema de Gestión</h1>
                    <p className="statement-subtitle">Statement</p>
                  </div>
                </div>
                <div className="statement-date print-date" style={{ display: 'none' }}>
                  <span>Fecha:</span> {e.fecha?.slice(0, 10)}
                </div>
                <button
                  className="btn-primary print-btn"
                  onClick={() => printStatement(e)}
                >
                  Imprimir
                </button>
              </div>

              <div className="statement-cliente-header">
                <div>
                  <h3 className="statement-cliente-name">{e.cliente_nombre || "Cliente sin nombre"}</h3>
                  <p className="statement-cliente-dir">{e.direccion_trabajo || "Sin dirección"}</p>
                </div>
                <span className={`badge badge-${e.estado === "aceptado" ? "success" : e.estado === "rechazado" ? "warning" : "soft"}`}>
                  {e.estado}
                </span>
              </div>

              <div className="statement-section">
                <h2 className="statement-section-title">Materials</h2>
                <table className="statement-table">
                  <thead>
                    <tr>
                      <th>Descripción</th>
                      <th>Cantidad</th>
                      <th>Precio Unit.</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="muted">Sin materials.</td>
                      </tr>
                    ) : (
                      items.map((item, iidx) => (
                        <tr key={iidx}>
                          <td>{item.descripcion}</td>
                          <td>{item.cantidad}</td>
                          <td>
                            {e.moneda} {Number(item.precio_unitario).toFixed(2)}
                          </td>
                          <td>
                            {e.moneda} {Number(item.cantidad * item.precio_unitario).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="items-total-label">Total</td>
                      <td className="items-total-value">
                        {e.moneda}{" "}
                        {Number(e.monto || 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {e.notas_adicionales?.trim() && (
                <div className="detalle-notas">
                  <span className="detalle-label">Notas Adicionales</span>
                  <p className="detalle-value">{e.notas_adicionales}</p>
                </div>
              )}
            </div>
            );
          })
        )}

        <div className="statement-footer">
          <div className="statement-total">
            <span>Total General:</span>
            <strong>${totalEstimado.toFixed(2)}</strong>
          </div>
        </div>
      </div>
    );
  };

  const renderListView = () => {
    return (
      <>
        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">{t(lang, "total_estimado")}</span>
            <span className="stat-value">${totalEstimado.toFixed(2)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">{t(lang, "cantidad_estimados")}</span>
            <span className="stat-value">{estimados.length}</span>
          </div>
        </section>

        <div className="page-toolbar">
          <input
            className="input search-bar"
            placeholder={t(lang, "busqueda")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="page-toolbar">
          <div className="pill-group">
            {[
              { id: "todos", label: t(lang, "todos") },
              { id: "borrador", label: t(lang, "borrador") },
              { id: "enviado", label: t(lang, "enviado") },
              { id: "aceptado", label: t(lang, "aceptado") },
              { id: "rechazado", label: t(lang, "rechazado") },
            ].map((opt) => (
              <button
                key={opt.id}
                className={"pill" + (filterEstado === opt.id ? " pill--active" : "")}
                onClick={() => setFilterEstado(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="muted">{t(lang, "cargando")}</p>
        ) : filtrados.length === 0 ? (
          <p className="muted">{t(lang, "sin_resultados")}</p>
        ) : (
          <div className="list">
            {filtrados.map((e) => (
              <article key={e.id} className="card">
                <div className="card-main">
                  <div className="badge-row">
                    <span className="badge badge-soft">
                      {e.fecha?.slice(0, 10)}
                    </span>
                    <span className="badge badge-soft">
                      ${Number(e.monto || 0).toFixed(2)}
                    </span>
                    <span className="badge badge-soft">{e.moneda}</span>
                  </div>
                  <h3 className="card-title">
                    {e.cliente_nombre || t(lang, "cliente_sin_nombre")}
                  </h3>
                  <p className="card-text">{e.direccion_trabajo}</p>
                  <p className="card-text muted">
                    {e.descripcion_trabajo?.slice(0, 120)}…
                  </p>
                </div>
                <div className="card-meta">
                  <span
                    className={
                      "badge " +
                      (e.estado === "aceptado"
                        ? "badge-success"
                        : e.estado === "rechazado"
                        ? "badge-warning"
                        : e.estado === "enviado"
                        ? "badge-soft"
                        : "badge-muted")
                    }
                  >
                    {e.estado}
                  </span>
                  <div className="card-actions">
                    <button
                      className="btn-ghost"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        openStatement(e);
                      }}
                    >
                      {t(lang, "statement")}
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        openEditModal(e);
                      }}
                    >
                      {t(lang, "editar")}
                    </button>
                    <button
                      className="btn-danger-ghost"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        askDelete(e);
                      }}
                    >
                      {t(lang, "eliminar")}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header-main">
          <h2 className="page-title">{t(lang, "estimados")}</h2>
          <p className="page-subtitle">
            {t(lang, "estimados_page_subtitle")}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className={`pill ${viewMode === "list" ? "pill--active" : ""}`}
            onClick={() => setViewMode("list")}
          >
            {t(lang, "lista")}
          </button>
          <button
            className={`pill ${viewMode === "statement" ? "pill--active" : ""}`}
            onClick={() => setViewMode("statement")}
          >
            {t(lang, "statement")}
          </button>
          <button className="btn-primary" onClick={openNewModal}>
            + {t(lang, "nuevo_estimado")}
          </button>
        </div>
      </header>

      {viewMode === "statement" ? renderStatementView() : renderListView()}

      {/* Modal crear / editar */}
      <Modal
        open={modalOpen}
        title={editingEstimado ? t(lang, "editar_estimado_title") : t(lang, "nuevo_estimado_title")}
        onClose={() => setModalOpen(false)}
        wide
      >
        <form className="items-form" onSubmit={handleSubmit}>
          <div className="items-form-section">
            <h3 className="items-form-title">{t(lang, "datos_cliente")}</h3>
            <div className="items-form-grid">
              <label className="form-field">
                <span>{t(lang, "cliente")}</span>
                <SearchableSelect
                  value={form.cliente_id}
                  onChange={handleChange}
                  options={clientes.map(c => ({ value: c.id, label: c.nombre }))}
                  placeholder={t(lang, "seleccionar_cliente")}
                />
              </label>
              <label className="form-field">
                <span>{t(lang, "direccion_trabajo")}</span>
                <input
                  className="input"
                  name="direccion_trabajo"
                  value={form.direccion_trabajo}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="form-field">
                <span>{t(lang, "fecha")}</span>
                <input
                  className="input"
                  type="date"
                  name="fecha"
                  value={form.fecha}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>
          </div>

          <div className="items-form-section">
            <h3 className="items-form-title">{t(lang, "agregar_materials")}</h3>
            <div className="items-input-row">
              <div className="items-input-field items-input-desc">
                <span>{t(lang, "descripcion")}</span>
                <input
                  className="input"
                  name="descripcion"
                  value={newItem.descripcion}
                  onChange={handleNewItemChange}
                  placeholder={t(lang, "ejemplo_material")}
                />
              </div>
              <div className="items-input-field">
                <span>{t(lang, "cantidad")}</span>
                <input
                  className="input"
                  type="number"
                  name="cantidad"
                  value={newItem.cantidad}
                  onChange={handleNewItemChange}
                  min="1"
                />
              </div>
              <div className="items-input-field">
                <span>{t(lang, "precio_unit")}</span>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  name="precio_unitario"
                  value={newItem.precio_unitario}
                  onChange={handleNewItemChange}
                  placeholder="0.00"
                />
              </div>
              <button
                type="button"
                className="btn-add-item"
                onClick={addItem}
              >
                +
              </button>
            </div>
          </div>

          <div className="items-form-section">
            <h3 className="items-form-title">{t(lang, "materials_agregados")}</h3>
            {items.length === 0 ? (
              <p className="muted">{t(lang, "sin_materials")}</p>
            ) : (
              <table className="items-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t(lang, "descripcion")}</th>
                    <th>{t(lang, "cantidad")}</th>
                    <th>{t(lang, "precio_unit")}</th>
                    <th>{t(lang, "total")}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{item.descripcion}</td>
                      <td>{item.cantidad}</td>
                      <td>${Number(item.precio_unitario || 0).toFixed(2)}</td>
                      <td>${Number(item.total || (item.cantidad * item.precio_unitario) || 0).toFixed(2)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-remove-item"
                          onClick={() => removeItem(index)}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="items-total-label">
                      {t(lang, "total_estimado")}
                    </td>
                    <td className="items-total-value">
                      ${calculateTotal().toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          <div className="items-form-section">
            <h3 className="items-form-title">{t(lang, "notas_adicionales_trabajo")}</h3>
            <div className="items-form-grid">
              <label className="form-field form-field--full">
                <span>{t(lang, "descripcion_trabajo")}</span>
                <textarea
                  className="input"
                  name="descripcion_trabajo"
                  value={form.descripcion_trabajo}
                  onChange={handleChange}
                  rows={3}
                  placeholder={t(lang, "descripcion_trabajo_placeholder")}
                />
              </label>
            </div>
          </div>

          <div className="items-form-footer">
            <div className="items-form-footer-left">
              <label className="form-field">
                <span>{t(lang, "estado")}</span>
                <select
                  className="input"
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                >
                  <option value="borrador">{t(lang, "borrador")}</option>
                  <option value="enviado">{t(lang, "enviado")}</option>
                  <option value="aceptado">{t(lang, "aceptado")}</option>
                  <option value="rechazado">{t(lang, "rechazado")}</option>
                </select>
              </label>
              <label className="form-field">
                <span>{t(lang, "moneda")}</span>
                <input
                  className="input"
                  name="moneda"
                  value={form.moneda}
                  onChange={handleChange}
                />
              </label>
            </div>
            <div className="items-form-footer-right">
              <span className="items-grand-total">
                {t(lang, "total")}: ${calculateTotal().toFixed(2)} {form.moneda}
              </span>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setModalOpen(false)}
            >
              {t(lang, "cancelar")}
            </button>
            <button type="submit" className="btn-primary">
              {t(lang, "guardar")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal confirmación eliminar */}
      <Modal
        open={confirmDeleteOpen}
        title={t(lang, "confirmar_eliminar")}
        onClose={cancelDelete}
      >
        <p>
          {t(lang, "seguro_eliminar_estimado")}
          {estimadoToDelete?.cliente_nombre
            ? ` de "${estimadoToDelete.cliente_nombre}" `
            : ""}
          ?
        </p>
        <div className="form-actions" style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={cancelDelete}
          >
            {t(lang, "cancelar")}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={confirmDelete}
          >
            {t(lang, "si_eliminar")}
          </button>
        </div>
      </Modal>

      {/* Modal detalle de estimado (click en la card) */}
      <Modal
        open={detailsOpen}
        title="Detalle del estimado"
        onClose={closeDetails}
        wide
      >
        {estimadoDetalle && (
          <div className="detalle-statement">
            <div className="statement-header-modal">
              <div className="statement-logo-section">
                <img src="/logo.jpg" alt="Logo" className="statement-logo-img" />
                <div className="statement-brand">
                  <h1 className="statement-title">Sistema de Gestión</h1>
                  <p className="statement-subtitle">Detalle</p>
                </div>
              </div>
              <div className="statement-date print-date" style={{ display: 'none' }}>
                <span>Fecha:</span> {estimadoDetalle.fecha?.slice(0, 10)}
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => printStatement(estimadoDetalle)}
              >
                Imprimir
              </button>
            </div>

            <div className="detalle-info-grid">
              <div className="detalle-info-item">
                <span className="detalle-label">Cliente</span>
                <span className="detalle-value">{estimadoDetalle.cliente_nombre || "Cliente sin nombre"}</span>
              </div>
              <div className="detalle-info-item">
                <span className="detalle-label">Dirección</span>
                <span className="detalle-value">{estimadoDetalle.direccion_trabajo || "—"}</span>
              </div>
              <div className="detalle-info-item">
                <span className="detalle-label">Estado</span>
                <span className={`badge badge-${estimadoDetalle.estado === "aceptado" ? "success" : estimadoDetalle.estado === "rechazado" ? "warning" : "soft"}`}>
                  {estimadoDetalle.estado}
                </span>
              </div>
            </div>

            <div className="statement-section">
              <h2 className="statement-section-title">Materials</h2>
              <table className="statement-table">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const items = getItemsFromDescripcion(estimadoDetalle.descripcion_trabajo, estimadoDetalle.monto, estimadoDetalle.moneda);
                    if (items.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} className="muted">
                            No hay materiales registrados.
                          </td>
                        </tr>
                      );
                    }
                    return items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.descripcion}</td>
                        <td>{item.cantidad}</td>
                        <td>
                          {estimadoDetalle.moneda}{" "}
                          {Number(item.precio_unitario).toFixed(2)}
                        </td>
                        <td>
                          {estimadoDetalle.moneda}{" "}
                          {Number(item.cantidad * item.precio_unitario).toFixed(2)}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="items-total-label">Total</td>
                    <td className="items-total-value">
                      {estimadoDetalle.moneda} {Number(estimadoDetalle.monto || 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {estimadoDetalle.notas_adicionales?.trim() && (
              <div className="detalle-notas">
                <span className="detalle-label">Notas Adicionales</span>
                <p className="detalle-value">{estimadoDetalle.notas_adicionales}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Statement individual */}
      <Modal
        open={statementOpen}
        title="Statement"
        onClose={closeStatement}
        wide
      >
        {estimadoStatement && (
          <div className="statement-modal">
            <div className="statement-header-modal">
              <div className="statement-logo-section">
                <img src="/logo.jpg" alt="Logo" className="statement-logo-img" />
                <div className="statement-brand">
                  <h1 className="statement-title">Sistema de Gestión</h1>
                  <p className="statement-subtitle">Statement</p>
                </div>
              </div>
              <div className="statement-date print-date" style={{ display: 'none' }}>
                <span>Fecha:</span> {estimadoStatement.fecha?.slice(0, 10)}
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => printStatement(estimadoStatement)}
              >
                Imprimir
              </button>
            </div>

            <div className="statement-section">
              <h2 className="statement-section-title">Materials</h2>
              <table className="statement-table">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const items = getItemsFromDescripcion(estimadoStatement.descripcion_trabajo, estimadoStatement.monto, estimadoStatement.moneda);
                    if (items.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} className="muted">
                            No hay materiales registrados.
                          </td>
                        </tr>
                      );
                    }
                    return items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.descripcion}</td>
                        <td>{item.cantidad}</td>
                        <td>
                          {estimadoStatement.moneda}{" "}
                          {Number(item.precio_unitario).toFixed(2)}
                        </td>
                        <td>
                          {estimadoStatement.moneda}{" "}
                          {Number(item.cantidad * item.precio_unitario).toFixed(2)}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            <div className="statement-section">
              <h2 className="statement-section-title">Cliente</h2>
              <table className="statement-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Dirección</th>
                    <th>Estado</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      {estimadoStatement.cliente_nombre || "Cliente sin nombre"}
                    </td>
                    <td>{estimadoStatement.direccion_trabajo || "—"}</td>
                    <td>
                      <span
                        className={`badge badge-${
                          estimadoStatement.estado === "aceptado"
                            ? "success"
                            : estimadoStatement.estado === "rechazado"
                            ? "warning"
                            : "soft"
                        }`}
                      >
                        {estimadoStatement.estado}
                      </span>
                    </td>
                    <td>
                      {estimadoStatement.moneda}{" "}
                      {Number(estimadoStatement.monto || 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="statement-footer">
              <div className="statement-total">
                <span>Total:</span>
                <strong>
                  {estimadoStatement.moneda}{" "}
                  {Number(estimadoStatement.monto || 0).toFixed(2)}
                </strong>
              </div>
            </div>

            {estimadoStatement.notas_adicionales && (
              <div className="detalle-notas">
                <span className="detalle-label">Notas Adicionales</span>
                <p className="detalle-value">{estimadoStatement.notas_adicionales}</p>
              </div>
            )}

            <div className="form-actions" style={{ marginTop: "1rem" }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={closeStatement}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EstimadosPage;
