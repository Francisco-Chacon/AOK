// src/pages/RecibosPage.jsx
import React, { useEffect, useState } from "react";
import api from "../api/apiClient";
import Modal from "../components/Modal";
import SearchableSelect from "../components/SearchableSelect";
import { useLanguage } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";

const RecibosPage = () => {
  const { lang } = useLanguage();
  const [recibos, setRecibos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filter, setFilter] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecibo, setEditingRecibo] = useState(null);
  const [form, setForm] = useState({
    cliente_id: "",
    fecha: "",
    monto: "",
    estado: "pendiente",
    descripcion: "",
  });

  // Confirmación de borrado
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [reciboToDelete, setReciboToDelete] = useState(null);

  // Detalle al hacer click en la card
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [reciboDetalle, setReciboDetalle] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resRecibos, resClientes] = await Promise.all([
        api.get("/recibos"),
        api.get("/clientes"),
      ]);
      setRecibos(resRecibos.data || []);
      setClientes(resClientes.data || []);
    } catch (err) {
      console.error("Error cargando recibos", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalPagado = recibos
    .filter((r) => r.estado === "pagado")
    .reduce((acc, r) => acc + (r.monto || 0), 0);

  const totalPendiente = recibos
    .filter((r) => r.estado === "pendiente")
    .reduce((acc, r) => acc + (r.monto || 0), 0);

  const filtrados = recibos.filter((r) => {
    if (filter !== "todos" && r.estado !== filter) return false;
    if (!debouncedQuery) return true;
    const q = debouncedQuery.toLowerCase();
    return (
      (r.cliente_nombre || "").toLowerCase().includes(q) ||
      (r.descripcion || "").toLowerCase().includes(q) ||
      (r.estado || "").toLowerCase().includes(q) ||
      String(r.monto || "").toLowerCase().includes(q)
    );
  });

  const openNewModal = () => {
    setEditingRecibo(null);
    setForm({
      cliente_id: "",
      fecha: new Date().toISOString().slice(0, 10),
      monto: "",
      estado: "pendiente",
      descripcion: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (r) => {
    setEditingRecibo(r);
    setForm({
      cliente_id: r.cliente_id || "",
      fecha: (r.fecha || "").slice(0, 10),
      monto: r.monto || "",
      estado: r.estado || "pendiente",
      descripcion: r.descripcion || "",
    });
    setModalOpen(true);
  };

  const openDetails = (r) => {
    setReciboDetalle(r);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setReciboDetalle(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      monto: Number(form.monto) || 0,
    };

    try {
      if (editingRecibo) {
        await api.put(`/recibos/${editingRecibo.id}`, payload);
      } else {
        await api.post("/recibos", payload);
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error guardando recibo", err);
      alert("No se pudo guardar el recibo.");
    }
  };

  // Flujo de borrado
  const askDelete = (r) => {
    setReciboToDelete(r);
    setConfirmDeleteOpen(true);
  };

  const cancelDelete = () => {
    setConfirmDeleteOpen(false);
    setReciboToDelete(null);
  };

  const confirmDelete = async () => {
    if (!reciboToDelete) return;
    try {
      await api.delete(`/recibos/${reciboToDelete.id}`);
      await loadData();
    } catch (err) {
      console.error("Error eliminando recibo", err);
      alert("No se pudo eliminar el recibo.");
    } finally {
      setConfirmDeleteOpen(false);
      setReciboToDelete(null);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header-main">
          <h2 className="page-title">{t(lang, "recibos")}</h2>
          <p className="page-subtitle">
            {t(lang, "recibos_page_subtitle")}
          </p>
        </div>
        <button className="btn-primary" onClick={openNewModal}>
          + {t(lang, "nuevo_recibo")}
        </button>
      </header>

      <section className="stats-grid">
        <div className="stat-card stat-card--accent">
          <span className="stat-label">{t(lang, "total_pagado")}</span>
          <span className="stat-value">
            ${totalPagado.toFixed(2)}
          </span>
        </div>
        <div className="stat-card stat-card--warning">
          <span className="stat-label">{t(lang, "total_pendiente")}</span>
          <span className="stat-value">
            ${totalPendiente.toFixed(2)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t(lang, "cantidad_recibos")}</span>
          <span className="stat-value">{recibos.length}</span>
        </div>
      </section>

      <div className="page-toolbar">
        <input
          className="input search-bar"
          placeholder={t(lang, "busqueda")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="pill-group">
          {[
            { id: "todos", label: t(lang, "todos") },
            { id: "pendiente", label: t(lang, "pendiente") },
            { id: "pagado", label: t(lang, "pagado") },
            { id: "cancelado", label: t(lang, "cancelado") },
          ].map((opt) => (
            <button
              key={opt.id}
              className={"pill" + (filter === opt.id ? " pill--active" : "")}
              onClick={() => setFilter(opt.id)}
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
          {filtrados.map((r) => (
            <article
              key={r.id}
              className="card card--clickable"
              onClick={() => openDetails(r)}
            >
              <div className="card-main">
                <div className="badge-row">
                  <span className="badge badge-soft">
                    {r.codigo || `REC-${r.id}`}
                  </span>
                  <span
                    className={
                      "badge " +
                      (r.estado === "pagado"
                        ? "badge-success"
                        : r.estado === "pendiente"
                        ? "badge-warning"
                        : "badge-muted")
                    }
                  >
                    {r.estado}
                  </span>
                </div>
                <h3 className="card-title">
                  {r.cliente_nombre || t(lang, "cliente_sin_nombre")}
                </h3>
                <p className="card-text muted">
                  {r.descripcion
                    ? `${r.descripcion.slice(0, 120)}${
                        r.descripcion.length > 120 ? "…" : ""
                      }`
                    : t(lang, "sin_descripcion")}
                </p>
              </div>
              <div className="card-meta">
                <p className="card-text">
                  <strong>{t(lang, "fecha")}:</strong> {r.fecha?.slice(0, 10)}
                </p>
                <p className="card-text">
                  <strong>{t(lang, "monto")}:</strong> ${Number(r.monto || 0).toFixed(2)}
                </p>
                <div className="card-actions">
                  <button
                    className="btn-ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(r);
                    }}
                  >
                    {t(lang, "editar")}
                  </button>
                  <button
                    className="btn-danger-ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      askDelete(r);
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

      {/* Modal crear / editar */}
      <Modal
        open={modalOpen}
        title={editingRecibo ? t(lang, "editar_recibo_title") : t(lang, "nuevo_recibo_title")}
        onClose={() => setModalOpen(false)}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
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
          <label className="form-field">
            <span>{t(lang, "monto")}</span>
            <input
              className="input"
              type="number"
              step="0.01"
              name="monto"
              value={form.monto}
              onChange={handleChange}
              required
            />
          </label>
          <label className="form-field">
            <span>{t(lang, "estado")}</span>
            <select
              className="input"
              name="estado"
              value={form.estado}
              onChange={handleChange}
            >
              <option value="pendiente">{t(lang, "pendiente")}</option>
              <option value="pagado">{t(lang, "pagado")}</option>
              <option value="cancelado">{t(lang, "cancelado")}</option>
            </select>
          </label>
          <label className="form-field form-field--full">
            <span>{t(lang, "descripcion")}</span>
            <textarea
              className="input"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              rows={3}
            />
          </label>

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

      {/* Modal confirmación eliminar recibo */}
      <Modal
        open={confirmDeleteOpen}
        title={t(lang, "confirmar_eliminar")}
        onClose={cancelDelete}
      >
        <p>
          {t(lang, "seguro_eliminar_recibo")}
          {reciboToDelete?.codigo || (reciboToDelete && `REC-${reciboToDelete.id}`)}
          {reciboToDelete?.cliente_nombre
            ? ` de "${reciboToDelete.cliente_nombre}"`
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

      {/* Modal detalle de recibo (click en la card) */}
      <Modal
        open={detailsOpen}
        title={t(lang, "detalle_recibo")}
        onClose={closeDetails}
      >
        {reciboDetalle && (
          <div className="detalle-grid">
            <div>
              <p className="detalle-label">{t(lang, "codigo")}</p>
              <p className="detalle-value">
                {reciboDetalle.codigo || `REC-${reciboDetalle.id}`}
              </p>
            </div>
            <div>
              <p className="detalle-label">{t(lang, "cliente")}</p>
              <p className="detalle-value">
                {reciboDetalle.cliente_nombre || t(lang, "cliente_sin_nombre")}
              </p>
            </div>
            <div>
              <p className="detalle-label">{t(lang, "fecha")}</p>
              <p className="detalle-value">
                {reciboDetalle.fecha?.slice(0, 10) || "—"}
              </p>
            </div>
            <div>
              <p className="detalle-label">{t(lang, "estado")}</p>
              <p className="detalle-value">
                {reciboDetalle.estado || "—"}
              </p>
            </div>
            <div>
              <p className="detalle-label">{t(lang, "monto")}</p>
              <p className="detalle-value">
                ${Number(reciboDetalle.monto || 0).toFixed(2)}
              </p>
            </div>
            <div className="detalle-full">
              <p className="detalle-label">{t(lang, "descripcion")}</p>
              <p className="detalle-value detalle-value--multiline">
                {reciboDetalle.descripcion?.trim()
                  ? reciboDetalle.descripcion
                  : t(lang, "sin_descripcion")}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RecibosPage;
