// src/pages/EstimadosPage.jsx
import React, { useEffect, useState } from "react";
import api from "../api/apiClient";
import Modal from "../components/Modal";

const EstimadosPage = () => {
  const [estimados, setEstimados] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filterEstado, setFilterEstado] = useState("todos");
  const [loading, setLoading] = useState(true);

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

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [estimadoToDelete, setEstimadoToDelete] = useState(null);

  // 🔵 Detalle al hacer click en la card
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [estimadoDetalle, setEstimadoDetalle] = useState(null);

  // Cargar clientes y estimados por separado
  const loadData = async () => {
    setLoading(true);

    // 1) Clientes
    try {
      const resClientes = await api.get("/clientes");
      console.log("DEBUG clientes (estimados):", resClientes.data);
      setClientes(resClientes.data || []);
    } catch (err) {
      console.error("Error cargando clientes", err);
    }

    // 2) Estimados
    try {
      const resEstimados = await api.get("/estimados");
      console.log("DEBUG estimados:", resEstimados.data);
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
      descripcion_trabajo: e.descripcion_trabajo || "",
      estado: e.estado || "borrador",
    });
    setModalOpen(true);
  };

  // 🔵 Abrir / cerrar detalle
  const openDetails = (e) => {
    setEstimadoDetalle(e);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setEstimadoDetalle(null);
  };

  const handleChange = (ev) => {
    const { name, value } = ev.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const payload = {
      ...form,
      monto: Number(form.monto) || 0,
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

  const filtrados = estimados.filter((e) =>
    filterEstado === "todos" ? true : e.estado === filterEstado
  );

  const totalEstimado = estimados.reduce(
    (acc, e) => acc + (e.monto || 0),
    0
  );

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header-main">
          <h2 className="page-title">Estimados</h2>
          <p className="page-subtitle">
            Gestión de estimados para trabajos de pavers y otros.
          </p>
        </div>
        <button className="btn-primary" onClick={openNewModal}>
          + Nuevo estimado
        </button>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total estimado</span>
          <span className="stat-value">
            ${totalEstimado.toFixed(2)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Cantidad de estimados</span>
          <span className="stat-value">{estimados.length}</span>
        </div>
      </section>

      <div className="page-toolbar">
        <div className="pill-group">
          {[
            { id: "todos", label: "Todos" },
            { id: "borrador", label: "Borrador" },
            { id: "enviado", label: "Enviados" },
            { id: "aceptado", label: "Aceptados" },
            { id: "rechazado", label: "Rechazados" },
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
        <p className="muted">Cargando estimados…</p>
      ) : filtrados.length === 0 ? (
        <p className="muted">No hay estimados con ese filtro.</p>
      ) : (
        <div className="list">
          {filtrados.map((e) => (
            <article
              key={e.id}
              className="card card--clickable"
              onClick={() => openDetails(e)}
            >
              <div className="card-main">
                <div className="badge-row">
                  <span className="badge badge-soft">
                    {e.fecha?.slice(0, 10)}
                  </span>
                  <span className="badge badge-soft">
                    ${Number(e.monto || 0).toFixed(2)}
                  </span>
                  <span className="badge badge-soft">
                    {e.moneda}
                  </span>
                </div>
                <h3 className="card-title">
                  {e.cliente_nombre || "Cliente sin nombre"}
                </h3>
                <p className="card-text">
                  {e.direccion_trabajo}
                </p>
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
                      ? "badge-warning" // o badge-danger si la tienes
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
                      ev.stopPropagation(); // no abrir detalle
                      openEditModal(e);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-danger-ghost"
                    onClick={(ev) => {
                      ev.stopPropagation(); // no abrir detalle
                      askDelete(e);
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
        title={editingEstimado ? "Editar estimado" : "Nuevo estimado"}
        onClose={() => setModalOpen(false)}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Cliente</span>
            <select
              className="input"
              name="cliente_id"
              value={form.cliente_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione un cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Dirección del trabajo</span>
            <input
              className="input"
              name="direccion_trabajo"
              value={form.direccion_trabajo}
              onChange={handleChange}
              required
            />
          </label>
          <label className="form-field">
            <span>Fecha</span>
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
            <span>Monto</span>
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
            <span>Moneda</span>
            <input
              className="input"
              name="moneda"
              value={form.moneda}
              onChange={handleChange}
            />
          </label>
          <label className="form-field form-field--full">
            <span>Descripción del trabajo</span>
            <textarea
              className="input"
              name="descripcion_trabajo"
              value={form.descripcion_trabajo}
              onChange={handleChange}
              rows={4}
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
              <option value="borrador">Borrador</option>
              <option value="enviado">Enviado</option>
              <option value="aceptado">Aceptado</option>
              <option value="rechazado">Rechazado</option>
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

      {/* Modal confirmación eliminar */}
      <Modal
        open={confirmDeleteOpen}
        title="Confirmar eliminación"
        onClose={cancelDelete}
      >
        <p>
          ¿Seguro que deseas eliminar este estimado
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

      {/* Modal detalle de estimado (click en la card) */}
      <Modal
        open={detailsOpen}
        title="Detalle del estimado"
        onClose={closeDetails}
      >
        {estimadoDetalle && (
          <div className="detalle-grid">
            <div>
              <p className="detalle-label">Cliente</p>
              <p className="detalle-value">
                {estimadoDetalle.cliente_nombre || "Cliente sin nombre"}
              </p>
            </div>
            <div>
              <p className="detalle-label">Fecha</p>
              <p className="detalle-value">
                {estimadoDetalle.fecha?.slice(0, 10) || "—"}
              </p>
            </div>
            <div>
              <p className="detalle-label">Monto</p>
              <p className="detalle-value">
                ${Number(estimadoDetalle.monto || 0).toFixed(2)}{" "}
                {estimadoDetalle.moneda || ""}
              </p>
            </div>
            <div>
              <p className="detalle-label">Estado</p>
              <p className="detalle-value">
                {estimadoDetalle.estado || "—"}
              </p>
            </div>
            <div>
              <p className="detalle-label">Dirección del trabajo</p>
              <p className="detalle-value">
                {estimadoDetalle.direccion_trabajo || "Sin dirección"}
              </p>
            </div>
            <div className="detalle-full">
              <p className="detalle-label">Descripción del trabajo</p>
              <p className="detalle-value detalle-value--multiline">
                {estimadoDetalle.descripcion_trabajo?.trim()
                  ? estimadoDetalle.descripcion_trabajo
                  : "Sin descripción registrada."}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EstimadosPage;
