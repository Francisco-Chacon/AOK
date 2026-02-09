// src/pages/ClientesPage.jsx
import React, { useEffect, useState } from "react";
import api from "../api/apiClient";
import Modal from "../components/Modal";

const ClientesPage = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState("todos");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);

  // Este form usa SIEMPRE servicio_principal
  const [form, setForm] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    servicio_principal: "",
    estado: "activo",
  });

  // 🔴 Confirmación de borrado
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState(null);

  // 🔵 Detalle al hacer click en la card
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [clienteDetalle, setClienteDetalle] = useState(null);

  // Cargar clientes
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

  useEffect(() => {
    loadClientes();
  }, []);

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
  const askDelete = (cliente) => {
    setClienteToDelete(cliente);
    setConfirmDeleteOpen(true);
  };

  const cancelDelete = () => {
    setConfirmDeleteOpen(false);
    setClienteToDelete(null);
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
    }
  };

  // Filtros
  const filtrados = clientes.filter((c) => {
    if (filterEstado !== "todos" && c.estado !== filterEstado) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.nombre?.toLowerCase().includes(s) ||
      c.direccion?.toLowerCase().includes(s) ||
      c.telefono?.toLowerCase().includes(s)
    );
  });

  const total = clientes.length;
  const activos = clientes.filter((c) => c.estado === "activo").length;
  const inactivos = clientes.filter((c) => c.estado === "inactivo").length;
  const pendientes = clientes.filter((c) => c.estado === "pendiente").length;

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header-main">
          <h2 className="page-title">Clientes</h2>
          <p className="page-subtitle">
            Registro de clientes y servicios que se les brindan.
          </p>
        </div>
        <button className="btn-primary" onClick={openNewModal}>
          + Nuevo cliente
        </button>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total de clientes</span>
          <span className="stat-value">{total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Activos</span>
          <span className="stat-value">{activos}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Con seguimiento pendiente</span>
          <span className="stat-value">{pendientes}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Inactivos</span>
          <span className="stat-value">{inactivos}</span>
        </div>
      </section>

      <div className="page-toolbar">
        <input
          className="input"
          placeholder="Buscar por nombre, dirección o teléfono"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="pill-group">
          {[
            { id: "todos", label: "Todos" },
            { id: "activo", label: "Activos" },
            { id: "pendiente", label: "Pendientes" },
            { id: "inactivo", label: "Inactivos" },
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
        <p className="muted">Cargando clientes…</p>
      ) : filtrados.length === 0 ? (
        <p className="muted">No hay clientes que coincidan con el filtro.</p>
      ) : (
        <div className="list">
          {filtrados.map((c) => (
            <article
              key={c.id}
              className="card card--clickable"
              onClick={() => openDetails(c)}
            >
              <div className="card-main">
                <h3 className="card-title">{c.nombre}</h3>
                <p className="card-text">{c.direccion}</p>
                <p className="card-text">{c.telefono}</p>
              </div>
              <div className="card-meta">
                <div className="badge-row">
                  <span className="badge badge-soft">
                    {c.servicio_principal ||
                      c.tipo_servicio ||
                      c.servicio ||
                      "Sin servicio"}
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
                      e.stopPropagation(); // no abrir detalle
                      openEditModal(c);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-danger-ghost"
                    onClick={(e) => {
                      e.stopPropagation(); // no abrir detalle
                      askDelete(c);
                    }}
                  >
                    Eliminar
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
        title={editingCliente ? "Editar cliente" : "Nuevo cliente"}
        onClose={() => setModalOpen(false)}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Nombre</span>
            <input
              className="input"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </label>
          <label className="form-field">
            <span>Dirección</span>
            <input
              className="input"
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
            />
          </label>
          <label className="form-field">
            <span>Teléfono</span>
            <input
              className="input"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
            />
          </label>
          <label className="form-field">
            <span>Servicio principal</span>
            <input
              className="input"
              name="servicio_principal"
              value={form.servicio_principal}
              onChange={handleChange}
            />
          </label>
          <label className="form-field">
            <span>Estado</span>
            <select
              className="input"
              name="estado"
              value={form.estado}
              onChange={handleChange}
            >
              <option value="activo">Activo</option>
              <option value="pendiente">Pendiente</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </label>

          <div className="form-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Guardar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de confirmación para eliminar cliente */}
      <Modal
        open={confirmDeleteOpen}
        title="Confirmar eliminación"
        onClose={cancelDelete}
      >
        <p>
          ¿Seguro que deseas eliminar al cliente
          {clienteToDelete?.nombre ? ` "${clienteToDelete.nombre}"` : ""}?
        </p>
        <div className="form-actions" style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={cancelDelete}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={confirmDelete}
          >
            Sí, eliminar
          </button>
        </div>
      </Modal>

      {/* Modal de detalle de cliente (click en la card) */}
      <Modal
        open={detailsOpen}
        title="Detalle del cliente"
        onClose={closeDetails}
      >
        {clienteDetalle && (
          <div className="detalle-grid">
            <div>
              <p className="detalle-label">Nombre</p>
              <p className="detalle-value">{clienteDetalle.nombre || "—"}</p>
            </div>
            <div>
              <p className="detalle-label">Teléfono</p>
              <p className="detalle-value">
                {clienteDetalle.telefono || "Sin teléfono"}
              </p>
            </div>
            <div>
              <p className="detalle-label">Dirección</p>
              <p className="detalle-value">
                {clienteDetalle.direccion || "Sin dirección"}
              </p>
            </div>
            <div>
              <p className="detalle-label">Servicio principal</p>
              <p className="detalle-value">
                {clienteDetalle.servicio_principal ||
                  clienteDetalle.tipo_servicio ||
                  clienteDetalle.servicio ||
                  "Sin servicio"}
              </p>
            </div>
            <div>
              <p className="detalle-label">Estado</p>
              <p className="detalle-value">
                {clienteDetalle.estado || "Sin estado"}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClientesPage;
