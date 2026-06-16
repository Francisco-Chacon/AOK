// src/pages/ClientesPage.jsx
import React, { useEffect, useState } from "react";
import api from "../api/apiClient";
import Modal from "../components/Modal";
import { SkeletonCard, SkeletonStats } from "../components/Skeleton";
import { useLanguage } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";

const ClientesPage = () => {
  const { lang } = useLanguage();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
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

  // 🔴 Confirmación de borrado
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState(null);

  // 🔵 Detalle al hacer click en la card
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

  // 🔵 Abrir / cerrar detalle
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
      } else {
        await api.post("/clientes", form);
      }
      setModalOpen(false);
      await loadClientes();
    } catch (err) {
      console.error("Error guardando cliente", err);
      alert("Error al guardar el cliente.");
    }
  };

  // 🔴 Flujo de borrado con modal propio
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
      await loadClientes();
    } catch (err) {
      console.error("Error eliminando cliente", err);
      alert("No se pudo eliminar el cliente.");
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
        <input
          className="input search-bar w-full max-w-sm rounded-xl border border-[var(--record-border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-main)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-[rgba(var(--primary),0.16)]"
          placeholder={t(lang, "busqueda")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
        <p className="muted">{t(lang, "sin_resultados")}</p>
      ) : (
        <div className="list flex flex-col gap-3">
          {filtrados.map((c) => (
            <article
              key={c.id}
              className="card card--clickable flex cursor-pointer justify-between gap-5 rounded-xl border border-[var(--record-border)] bg-[var(--bg-card)] p-5 shadow-[var(--record-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--record-border-strong)] hover:shadow-[var(--record-shadow-hover)]"
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
                    className="btn-ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(c);
                    }}
                  >
                    {t(lang, "editar")}
                  </button>
                  <button
                    className="btn-danger-ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      askDelete(c);
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
        title={editingCliente ? t(lang, "editar_cliente_title") : t(lang, "nuevo_cliente_title")}
        onClose={() => setModalOpen(false)}
      >
        <form className="form-grid grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>{t(lang, "nombre")}</span>
            <input
              className="input"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </label>
          <label className="form-field">
            <span>{t(lang, "direccion")}</span>
            <input
              className="input"
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
            />
          </label>
          <label className="form-field">
            <span>{t(lang, "telefono")}</span>
            <input
              className="input"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
            />
          </label>
          <label className="form-field">
            <span>{t(lang, "email")}</span>
            <input
              className="input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
          </label>
          <label className="form-field">
            <span>{t(lang, "servicio_principal")}</span>
            <input
              className="input"
              name="servicio_principal"
              value={form.servicio_principal}
              onChange={handleChange}
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
              <option value="activo">{t(lang, "activo")}</option>
              <option value="pendiente">{t(lang, "pendiente")}</option>
              <option value="inactivo">{t(lang, "inactivo")}</option>
            </select>
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

      {/* Modal de confirmación para eliminar cliente */}
      <Modal
        open={confirmDeleteOpen}
        title={t(lang, "confirmar_eliminar")}
        onClose={cancelDelete}
      >
        <p>
          {t(lang, "seguro_eliminar_cliente")}
          {clienteToDelete?.nombre ? ` "${clienteToDelete.nombre}"` : ""}?
        </p>
          {recibosCount > 0 && (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", color: "var(--accent-warning)", marginTop: "0.5rem", fontSize: "0.9rem" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px" }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01" />
            </svg>
            <span>Este cliente tiene {recibosCount} recibo(s) asociado(s). Al eliminarlo también se eliminarán todos sus recibos.</span>
          </div>
        )}
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

      {/* Modal de detalle de cliente (click en la card) */}
      <Modal
        open={detailsOpen}
        title={t(lang, "detalle_cliente")}
        onClose={closeDetails}
      >
        {clienteDetalle && (
          <div className="detalle-grid">
            <div>
              <p className="detalle-label">{t(lang, "nombre")}</p>
              <p className="detalle-value">{clienteDetalle.nombre || "—"}</p>
            </div>
            <div>
              <p className="detalle-label">{t(lang, "telefono")}</p>
              <p className="detalle-value">
                {clienteDetalle.telefono || t(lang, "sin_telefono")}
              </p>
            </div>
            <div>
              <p className="detalle-label">{t(lang, "direccion")}</p>
              <p className="detalle-value">
                {clienteDetalle.direccion || t(lang, "sin_direccion")}
              </p>
            </div>
            <div>
              <p className="detalle-label">{t(lang, "servicio_principal")}</p>
              <p className="detalle-value">
                {clienteDetalle.servicio_principal ||
                  clienteDetalle.tipo_servicio ||
                  clienteDetalle.servicio ||
                  t(lang, "sin_servicio")}
              </p>
            </div>
            <div>
              <p className="detalle-label">{t(lang, "estado")}</p>
              <p className="detalle-value">
                {clienteDetalle.estado || t(lang, "sin_estado")}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClientesPage;
