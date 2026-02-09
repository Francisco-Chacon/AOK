// src/pages/RecibosPage.jsx
import React, { useEffect, useState } from "react";
import api from "../api/apiClient";
import Modal from "../components/Modal";

const RecibosPage = () => {
  const [recibos, setRecibos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filter, setFilter] = useState("todos");
  const [loading, setLoading] = useState(true);

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

  const filtrados = recibos.filter((r) =>
    filter === "todos" ? true : r.estado === filter
  );

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
          <h2 className="page-title">Recibos</h2>
          <p className="page-subtitle">
            Seguimiento de cobros, pagos y montos pendientes.
          </p>
        </div>
        <button className="btn-primary" onClick={openNewModal}>
          + Nuevo recibo
        </button>
      </header>

      <section className="stats-grid">
        <div className="stat-card stat-card--accent">
          <span className="stat-label">Total pagado</span>
          <span className="stat-value">
            ${totalPagado.toFixed(2)}
          </span>
        </div>
        <div className="stat-card stat-card--warning">
          <span className="stat-label">Total pendiente</span>
          <span className="stat-value">
            ${totalPendiente.toFixed(2)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Cantidad de recibos</span>
          <span className="stat-value">{recibos.length}</span>
        </div>
      </section>

      <div className="page-toolbar">
        <div className="pill-group">
          {[
            { id: "todos", label: "Todos" },
            { id: "pendiente", label: "Pendientes" },
            { id: "pagado", label: "Pagados" },
            { id: "cancelado", label: "Cancelados" },
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
        <p className="muted">Cargando recibos…</p>
      ) : filtrados.length === 0 ? (
        <p className="muted">No hay recibos con ese filtro.</p>
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
                  {r.cliente_nombre || "Cliente sin nombre"}
                </h3>
                <p className="card-text muted">
                  {r.descripcion
                    ? `${r.descripcion.slice(0, 120)}${
                        r.descripcion.length > 120 ? "…" : ""
                      }`
                    : "Sin descripción."}
                </p>
              </div>
              <div className="card-meta">
                <p className="card-text">
                  <strong>Fecha:</strong> {r.fecha?.slice(0, 10)}
                </p>
                <p className="card-text">
                  <strong>Monto:</strong> ${Number(r.monto || 0).toFixed(2)}
                </p>
                <div className="card-actions">
                  <button
                    className="btn-ghost"
                    onClick={(e) => {
                      e.stopPropagation(); // no abrir detalle
                      openEditModal(r);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-danger-ghost"
                    onClick={(e) => {
                      e.stopPropagation(); // no abrir detalle
                      askDelete(r);
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
        title={editingRecibo ? "Editar recibo" : "Nuevo recibo"}
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
            <span>Estado</span>
            <select
              className="input"
              name="estado"
              value={form.estado}
              onChange={handleChange}
            >
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </label>
          <label className="form-field form-field--full">
            <span>Descripción</span>
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
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Guardar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal confirmación eliminar recibo */}
      <Modal
        open={confirmDeleteOpen}
        title="Confirmar eliminación"
        onClose={cancelDelete}
      >
        <p>
          ¿Seguro que deseas eliminar el recibo{" "}
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

      {/* Modal detalle de recibo (click en la card) */}
      <Modal
        open={detailsOpen}
        title="Detalle del recibo"
        onClose={closeDetails}
      >
        {reciboDetalle && (
          <div className="detalle-grid">
            <div>
              <p className="detalle-label">Código</p>
              <p className="detalle-value">
                {reciboDetalle.codigo || `REC-${reciboDetalle.id}`}
              </p>
            </div>
            <div>
              <p className="detalle-label">Cliente</p>
              <p className="detalle-value">
                {reciboDetalle.cliente_nombre || "Cliente sin nombre"}
              </p>
            </div>
            <div>
              <p className="detalle-label">Fecha</p>
              <p className="detalle-value">
                {reciboDetalle.fecha?.slice(0, 10) || "—"}
              </p>
            </div>
            <div>
              <p className="detalle-label">Estado</p>
              <p className="detalle-value">
                {reciboDetalle.estado || "—"}
              </p>
            </div>
            <div>
              <p className="detalle-label">Monto</p>
              <p className="detalle-value">
                ${Number(reciboDetalle.monto || 0).toFixed(2)}
              </p>
            </div>
            <div className="detalle-full">
              <p className="detalle-label">Descripción</p>
              <p className="detalle-value detalle-value--multiline">
                {reciboDetalle.descripcion?.trim()
                  ? reciboDetalle.descripcion
                  : "Sin descripción registrada."}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RecibosPage;
