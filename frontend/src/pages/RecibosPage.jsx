// src/pages/RecibosPage.jsx
import React, { useEffect, useState } from "react";
import api from "../api/apiClient";
import Modal from "../components/Modal";
import SearchableSelect from "../components/SearchableSelect";
import EmptyState from "../components/EmptyState";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import { SkeletonCard } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { useLanguage } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";

const RecibosPage = () => {
  const { lang } = useLanguage();
  const toast = useToast();
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
  const LIMIT = 20;
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [debouncedQuery, filter]);

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
    Promise.all([api.get("/recibos"), api.get("/clientes")]).then(([resRecibos, resClientes]) => {
      setRecibos(resRecibos.data || []);
      setClientes(resClientes.data || []);
    }).catch((err) => console.error("Error cargando recibos", err)).finally(() => setLoading(false));
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

  const totalPages = Math.ceil(filtrados.length / LIMIT);
  const paginated = filtrados.slice((page - 1) * LIMIT, page * LIMIT);

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
        toast("Recibo actualizado correctamente.", "success");
      } else {
        await api.post("/recibos", payload);
        toast("Recibo creado correctamente.", "success");
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error guardando recibo", err);
      toast("No se pudo guardar el recibo.", "error");
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
      toast("Recibo eliminado correctamente.", "success");
      await loadData();
    } catch (err) {
      console.error("Error eliminando recibo", err);
      toast("No se pudo eliminar el recibo.", "error");
    } finally {
      setConfirmDeleteOpen(false);
      setReciboToDelete(null);
    }
  };

  return (
    <div className="page mx-auto w-full max-w-6xl">
      <header className="page-header mb-6 flex items-center justify-between gap-4 rounded-3xl border border-[var(--record-border)] bg-[var(--bg-panel)] px-5 py-5 shadow-[var(--shadow-soft)] backdrop-blur">
        <div className="page-header-main flex flex-col gap-1">
          <h2 className="page-title text-3xl font-bold tracking-[-0.035em] text-[var(--text-main)]">{t(lang, "recibos")}</h2>
          <p className="page-subtitle text-sm text-[var(--text-muted)]">
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

      <div className="page-toolbar mb-5 flex items-center justify-between gap-4">
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t(lang, "busqueda")}
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
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          svg="M7 3h10a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2 M10 8h6 M10 12h6 M10 16h3"
          title={t(lang, "sin_resultados")}
          description={t(lang, "recibos_page_subtitle")}
        />
      ) : (
        <div className="list flex flex-col gap-3">
          {paginated.map((r) => (
            <article
              key={r.id}
              className="card card--clickable flex cursor-pointer justify-between gap-5 rounded-xl border border-[var(--record-border)] bg-[var(--bg-card)] p-5 shadow-[var(--record-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--record-border-strong)] hover:shadow-[var(--record-shadow-hover)]"
              onClick={() => openDetails(r)}
            >
              <div className="card-main flex flex-col gap-1">
                <div className="badge-row flex items-center gap-1.5">
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
              <div className="card-meta flex min-w-40 flex-col items-end gap-1.5">
                <p className="card-text">
                  <strong>{t(lang, "fecha")}:</strong> {r.fecha?.slice(0, 10)}
                </p>
                <p className="card-text">
                  <strong>{t(lang, "monto")}:</strong> ${Number(r.monto || 0).toFixed(2)}
                </p>
                <div className="card-actions">
                  <button
                    className="btn-action btn-action--edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(r);
                    }}
                  >
                    <svg className="btn-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                    {t(lang, "editar")}
                  </button>
                  <button
                    className="btn-action btn-action--delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      askDelete(r);
                    }}
                  >
                    <svg className="btn-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                    {t(lang, "eliminar")}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {filtrados.length > 0 && (
        <Pagination page={page} totalPages={totalPages} total={filtrados.length} limit={LIMIT} onPageChange={setPage} />
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
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--danger-soft)]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[rgb(var(--destructive))]">
              <path d="M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6" />
            </svg>
          </div>
          <p className="font-semibold text-[var(--text-main)]">
            {t(lang, "seguro_eliminar_recibo")}
            <span className="font-bold">{reciboToDelete?.codigo || (reciboToDelete && `REC-${reciboToDelete.id}`)}</span>
            {reciboToDelete?.cliente_nombre
              ? <span> de "{reciboToDelete.cliente_nombre}"</span>
              : ""}?
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn-ghost" onClick={cancelDelete}>{t(lang, "cancelar")}</button>
          <button type="button" className="btn btn-danger" onClick={confirmDelete}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
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
