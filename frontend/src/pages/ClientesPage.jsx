// src/pages/ClientesPage.jsx
import React, { useEffect, useState } from "react";
import api from "../api/apiClient";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import { SkeletonCard, SkeletonStats } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { useLanguage } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";

const ClientesPage = () => {
  const { lang } = useLanguage();
  const toast = useToast();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const LIMIT = 20;
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [debouncedQuery, filterEstado]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);

  // Este form usa SIEMPRE servicio_principal
  const [form, setForm] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    email: "",
    servicio_principal: "",
    estado: "activo",
  });

  // Confirmación de borrado
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState(null);

  // Detalle al hacer click en la card
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [clienteDetalle, setClienteDetalle] = useState(null);

  useEffect(() => {
    api.get("/clientes")
      .then((res) => setClientes(res.data || []))
      .catch((err) => console.error("Error cargando clientes", err))
      .finally(() => setLoading(false));
  }, []);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/clientes");
      setClientes(res.data || []);
    } catch (err) {
      console.error("Error cargando clientes", err);
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal para nuevo cliente
  const openNewModal = () => {
    setEditingCliente(null);
    setForm({
      nombre: "",
      direccion: "",
      telefono: "",
      servicio_principal: "",
      estado: "activo",
    });
    setModalOpen(true);
  };

  // Abrir modal para editar
  const openEditModal = (cliente) => {
    setEditingCliente(cliente);
    setForm({
      nombre: cliente.nombre || "",
      direccion: cliente.direccion || "",
      telefono: cliente.telefono || "",
      // intentamos leer como servicio_principal, si no, tipo_servicio o servicio
      servicio_principal:
        cliente.servicio_principal ||
        cliente.tipo_servicio ||
        cliente.servicio ||
        "",
      estado: cliente.estado || "activo",
    });
    setModalOpen(true);
  };

  // Abrir / cerrar detalle
  const openDetails = (cliente) => {
    setClienteDetalle(cliente);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setClienteDetalle(null);
  };

  // Manejo de inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Crear / actualizar
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCliente) {
        await api.put(`/clientes/${editingCliente.id}`, form);
        toast("Cliente actualizado correctamente.", "success");
      } else {
        await api.post("/clientes", form);
        toast("Cliente creado correctamente.", "success");
      }
      setModalOpen(false);
      await loadClientes();
    } catch (err) {
      console.error("Error guardando cliente", err);
      toast("Error al guardar el cliente.", "error");
    }
  };

  // Flujo de borrado con modal propio
  const [recibosCount, setRecibosCount] = useState(0);

  const askDelete = async (cliente) => {
    try {
      const res = await api.get(`/clientes/${cliente.id}/recibos-count`);
      const count = res.data.count || 0;
      setRecibosCount(count);
    } catch (err) {
      setRecibosCount(0);
    }
    setClienteToDelete(cliente);
    setConfirmDeleteOpen(true);
  };

  const cancelDelete = () => {
    setConfirmDeleteOpen(false);
    setClienteToDelete(null);
    setRecibosCount(0);
  };

  const confirmDelete = async () => {
    if (!clienteToDelete) return;
    try {
      await api.delete(`/clientes/${clienteToDelete.id}`);
      toast("Cliente eliminado correctamente.", "success");
      await loadClientes();
    } catch (err) {
      console.error("Error eliminando cliente", err);
      toast("No se pudo eliminar el cliente.", "error");
    } finally {
      setConfirmDeleteOpen(false);
      setClienteToDelete(null);
      setRecibosCount(0);
    }
  };

  // Filtros
  const filtrados = clientes.filter((c) => {
    if (filterEstado !== "todos" && c.estado !== filterEstado) return false;
    if (!debouncedQuery) return true;
    const s = debouncedQuery.toLowerCase();
    return (
      (c.nombre || "").toLowerCase().includes(s) ||
      (c.direccion || "").toLowerCase().includes(s) ||
      (c.telefono || "").toLowerCase().includes(s) ||
      (c.servicio_principal || "").toLowerCase().includes(s)
    );
  });

  const total = clientes.length;
  const activos = clientes.filter((c) => c.estado === "activo").length;
  const inactivos = clientes.filter((c) => c.estado === "inactivo").length;
  const pendientes = clientes.filter((c) => c.estado === "pendiente").length;
  const totalPages = Math.ceil(filtrados.length / LIMIT);
  const paginated = filtrados.slice((page - 1) * LIMIT, page * LIMIT);

  return (
<div className="page mx-auto w-full max-w-6xl">
      <header className="page-header mb-6 flex items-center justify-between gap-4 rounded-3xl border border-[var(--record-border)] bg-[var(--bg-panel)] px-5 py-5 shadow-[var(--shadow-soft)] backdrop-blur">
        <div className="page-header-main flex flex-col gap-1">
          <h2 className="page-title text-3xl font-bold tracking-[-0.035em] text-[var(--text-main)]">{t(lang, "clientes")}</h2>
          <p className="page-subtitle text-sm text-[var(--text-muted)]">
            {t(lang, "clientes_page_subtitle")}
          </p>
        </div>
        <button className="btn-primary" onClick={openNewModal}>
          + {t(lang, "nuevo_cliente")}
        </button>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">{t(lang, "total")}</span>
          <span className="stat-value">{total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t(lang, "activo")}</span>
          <span className="stat-value">{activos}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t(lang, "pendiente")}</span>
          <span className="stat-value">{pendientes}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t(lang, "inactivo")}</span>
          <span className="stat-value">{inactivos}</span>
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
            { id: "activo", label: t(lang, "activo") },
            { id: "pendiente", label: t(lang, "pendiente") },
            { id: "inactivo", label: t(lang, "inactivo") },
          ].map((opt) => (
            <button
              key={opt.id}
              className={
                "pill" + (filterEstado === opt.id ? " pill--active" : "")
              }
              onClick={() => setFilterEstado(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <>
          <SkeletonStats />
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </>
      ) : filtrados.length === 0 ? (
        <EmptyState
          svg="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75"
          title={t(lang, "sin_resultados")}
          description={t(lang, "clientes_page_subtitle")}
        />
      ) : (
        <div className="list flex flex-col gap-3">
          {paginated.map((c) => (
            <article
              key={c.id}
              className={`card card--clickable flex cursor-pointer justify-between gap-5 rounded-xl border border-[var(--record-border)] bg-[var(--bg-card)] p-5 shadow-[var(--record-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--record-border-strong)] hover:shadow-[var(--record-shadow-hover)] ${c.estado ? `card--status-${c.estado}` : ''}`}
              onClick={() => openDetails(c)}
            >
              <div className="card-main flex flex-col gap-1">
                <h3 className="card-title font-bold text-[var(--text-main)]">{c.nombre}</h3>
                <p className="card-text text-sm text-[var(--text-main)]">{c.direccion}</p>
                <p className="card-text text-sm text-[var(--text-main)]">{c.telefono}</p>
              </div>
              <div className="card-meta flex min-w-40 flex-col items-end gap-1.5">
                <div className="badge-row">
                  <span className="badge badge-soft">
                    {c.servicio_principal ||
                      c.tipo_servicio ||
                      c.servicio ||
                      t(lang, "sin_servicio")}
                  </span>
                  <span
                    className={
                      "badge " +
                      (c.estado === "activo"
                        ? "badge-success"
                        : c.estado === "pendiente"
                        ? "badge-warning"
                        : "badge-muted")
                    }
                  >
                    {c.estado}
                  </span>
                </div>
                <div className="card-actions">
                  <button
                    className="btn-action btn-action--edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(c);
                    }}
                  >
                    <svg className="btn-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                    {t(lang, "editar")}
                  </button>
                  <button
                    className="btn-action btn-action--delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      askDelete(c);
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
        title={editingCliente ? t(lang, "editar_cliente_title") : t(lang, "nuevo_cliente_title")}
        onClose={() => setModalOpen(false)}
      >
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary-soft)]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[rgb(var(--primary))]">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
            </svg>
          </div>

          <div className="form-grid grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
            <label className="form-field">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                {t(lang, "nombre")}
              </span>
              <input className="input" name="nombre" value={form.nombre} onChange={handleChange} required />
            </label>
            <label className="form-field">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                {t(lang, "direccion")}
              </span>
              <input className="input" name="direccion" value={form.direccion} onChange={handleChange} />
            </label>
            <label className="form-field">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                {t(lang, "telefono")}
              </span>
              <input className="input" name="telefono" value={form.telefono} onChange={handleChange} />
            </label>
            <label className="form-field">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                {t(lang, "email")}
              </span>
              <input className="input" type="email" name="email" value={form.email} onChange={handleChange} />
            </label>
            <label className="form-field">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" />
                </svg>
                {t(lang, "servicio_principal")}
              </span>
              <input className="input" name="servicio_principal" value={form.servicio_principal} onChange={handleChange} />
            </label>
            <label className="form-field">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="M12 16v-4 M12 8h.01" />
                </svg>
                {t(lang, "estado")}
              </span>
              <select className="input" name="estado" value={form.estado} onChange={handleChange}>
                <option value="activo">{t(lang, "activo")}</option>
                <option value="pendiente">{t(lang, "pendiente")}</option>
                <option value="inactivo">{t(lang, "inactivo")}</option>
              </select>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[var(--record-border)] pt-5">
            <button type="button" className="btn-ghost px-5 py-2.5" onClick={() => setModalOpen(false)}>
              {t(lang, "cancelar")}
            </button>
            <button type="submit" className="btn-primary px-6 py-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 inline-block">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M17 21v-8H7v8 M7 3v5h8" />
              </svg>
              {t(lang, "guardar")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de confirmación para eliminar cliente */}
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
          <div>
            <p className="font-semibold text-[var(--text-main)]">
              {t(lang, "seguro_eliminar_cliente")}
              {clienteToDelete?.nombre ? <span className="font-bold"> "{clienteToDelete.nombre}"</span> : ""}?
            </p>
            {recibosCount > 0 && (
              <p className="mt-2 text-sm text-[rgb(var(--warning))]">
                Este cliente tiene <strong>{recibosCount}</strong> recibo(s) asociado(s). Al eliminarlo también se eliminarán todos sus recibos.
              </p>
            )}
          </div>
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

      {/* Modal de detalle de cliente (click en la card) */}
      <Modal
        open={detailsOpen}
        title={t(lang, "detalle_cliente")}
        onClose={closeDetails}
      >
        {clienteDetalle && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 border-b border-[var(--record-border)] pb-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--primary-soft)]">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[rgb(var(--primary))]">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-[var(--text-main)]">{clienteDetalle.nombre || "—"}</h3>
                <span className={`mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${
                  clienteDetalle.estado === "activo" ? "bg-[rgba(var(--success),0.12)] text-[rgb(var(--success))]" :
                  clienteDetalle.estado === "pendiente" ? "bg-[rgba(var(--warning),0.12)] text-[rgb(var(--warning))]" :
                  "bg-[var(--bg-hover)] text-[var(--text-muted)]"
                }`}>
                  {clienteDetalle.estado || t(lang, "sin_estado")}
                </span>
              </div>
            </div>

            <div className="detalle-grid">
              <div>
                <p className="detalle-label flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  {t(lang, "telefono")}
                </p>
                <p className="detalle-value">{clienteDetalle.telefono || t(lang, "sin_telefono")}</p>
              </div>
              <div>
                <p className="detalle-label flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  Email
                </p>
                <p className="detalle-value">{clienteDetalle.email || "—"}</p>
              </div>
              <div className="detalle-full">
                <p className="detalle-label flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  {t(lang, "direccion")}
                </p>
                <p className="detalle-value">{clienteDetalle.direccion || t(lang, "sin_direccion")}</p>
              </div>
              <div className="detalle-full">
                <p className="detalle-label flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" />
                  </svg>
                  {t(lang, "servicio_principal")}
                </p>
                <p className="detalle-value">
                  {clienteDetalle.servicio_principal ||
                    clienteDetalle.tipo_servicio ||
                    clienteDetalle.servicio ||
                    t(lang, "sin_servicio")}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClientesPage;
