// src/pages/RutasPage.jsx
import React, { useEffect, useState } from "react";
import api from "../api/apiClient";
import Modal from "../components/Modal";

const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const DIAS_FILTRO = ["todos", ...DIAS];

const RutasPage = () => {
  const [visitas, setVisitas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [diaActivo, setDiaActivo] = useState("todos");
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingVisita, setEditingVisita] = useState(null);
  const [form, setForm] = useState({
    cliente_id: "",
    fecha: new Date().toISOString().slice(0, 10),
    direccion: "",
    hora: "08:00",
    duracion_minutos: 60,
    tipo_servicio: "",
  });

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [visitaToDelete, setVisitaToDelete] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [visitaDetalle, setVisitaDetalle] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resVisitas, resClientes] = await Promise.all([
        api.get("/visitas"),
        api.get("/clientes"),
      ]);

      setVisitas(resVisitas.data || []);
      setClientes(resClientes.data || []);
    } catch (err) {
      console.error("Error cargando visitas", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const visitasPorDia = (dia) =>
    visitas.filter((v) => {
      const raw = (v.dia_semana ?? "").toString().toLowerCase().trim();
      return raw === dia;
    });

  const visitasFiltradas =
    diaActivo === "todos" ? visitas : visitasPorDia(diaActivo);

  const openNewModal = () => {
    setEditingVisita(null);
    setForm({
      cliente_id: "",
      fecha: new Date().toISOString().slice(0, 10),
      direccion: "",
      hora: "08:00",
      duracion_minutos: 60,
      tipo_servicio: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (v) => {
    setEditingVisita(v);
    setForm({
      cliente_id: v.cliente_id || "",
      fecha: v.fecha ? v.fecha.slice(0, 10) : new Date().toISOString().slice(0, 10),
      direccion: v.direccion || "",
      hora: v.hora || "08:00",
      duracion_minutos: v.duracion_minutos || 60,
      tipo_servicio: v.tipo_servicio || "",
    });
    setModalOpen(true);
  };

  const openDetails = (v) => {
    setVisitaDetalle(v);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setVisitaDetalle(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      cliente_id: form.cliente_id,
      fecha: form.fecha,
      hora: form.hora,
      duracion_minutos: Number(form.duracion_minutos) || 60,
      direccion: form.direccion,
      tipo_servicio: form.tipo_servicio,
    };

    try {
      if (editingVisita) {
        await api.put(`/visitas/${editingVisita.id}`, payload);
      } else {
        await api.post("/visitas", payload);
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error guardando visita", err);
      alert("No se pudo guardar la visita.");
    }
  };

  const askDelete = (v) => {
    setVisitaToDelete(v);
    setConfirmDeleteOpen(true);
  };

  const cancelDelete = () => {
    setConfirmDeleteOpen(false);
    setVisitaToDelete(null);
  };

  const confirmDelete = async () => {
    if (!visitaToDelete) return;
    try {
      await api.delete(`/visitas/${visitaToDelete.id}`);
      await loadData();
    } catch (err) {
      console.error("Error eliminando visita", err);
      alert("No se pudo eliminar la visita.");
    } finally {
      setConfirmDeleteOpen(false);
      setVisitaToDelete(null);
    }
  };

  const capitalizar = (txt) =>
    txt ? txt.charAt(0).toUpperCase() + txt.slice(1) : "";

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header-main">
          <h2 className="page-title">Rutas y visitas</h2>
          <p className="page-subtitle">
            Agenda semanal de visitas programadas a clientes.
          </p>
        </div>
        <button className="btn-primary" onClick={openNewModal}>
          + Nueva visita
        </button>
      </header>

      <p className="muted" style={{ marginBottom: "0.5rem" }}>
        Total visitas en el sistema: {visitas.length}
      </p>

      <section className="stats-grid stats-grid--scroll">
        {DIAS.map((dia) => (
          <div key={dia} className="stat-card">
            <span className="stat-label">{capitalizar(dia)}</span>
            <span className="stat-value">
              {visitasPorDia(dia).length} visitas
            </span>
          </div>
        ))}
      </section>

      <div className="page-toolbar">
        <div className="pill-group">
          {DIAS_FILTRO.map((diaKey) => (
            <button
              key={diaKey}
              className={"pill" + (diaActivo === diaKey ? " pill--active" : "")}
              onClick={() => setDiaActivo(diaKey)}
            >
              {diaKey === "todos" ? "Todos" : capitalizar(diaKey)}
            </button>
          ))}
        </div>
        <span className="muted">
          {diaActivo === "todos"
            ? `${visitas.length} visita(s) en total`
            : `${visitasFiltradas.length} visita(s) para ${capitalizar(
                diaActivo
              )}`}
        </span>
      </div>

      {loading ? (
        <p className="muted">Cargando visitas…</p>
      ) : visitasFiltradas.length === 0 ? (
        <p className="muted">
          {diaActivo === "todos"
            ? "No hay visitas registradas."
            : "No hay visitas programadas para este día."}
        </p>
      ) : (
        <div className="list">
          {visitasFiltradas.map((v) => (
            <article
              key={v.id}
              className="card card--wide card--clickable"
              onClick={() => openDetails(v)}
            >
              <div className="card-main">
                <div className="badge-row">
                  <span className="pill pill--soft">
                    {v.fecha ? v.fecha.slice(0, 10) : "Sin fecha"}
                  </span>
                  <span className="pill pill--soft">{v.hora}</span>
                  <span className="pill pill--soft">
                    {v.duracion_minutos} min
                  </span>
                </div>
                <h3 className="card-title">
                  {v.cliente_nombre || "Cliente sin nombre"}
                </h3>
                <p className="card-text">{v.direccion}</p>
              </div>
              <div className="card-meta">
                <span className="badge badge-soft">
                  {v.tipo_servicio || "Servicio"}
                </span>
                <div className="card-actions">
                  <button
                    className="btn-ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(v);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-danger-ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      askDelete(v);
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

      <Modal
        open={modalOpen}
        title={editingVisita ? "Editar visita" : "Nueva visita"}
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
            <span>Hora</span>
            <input
              className="input"
              name="hora"
              type="time"
              value={form.hora}
              onChange={handleChange}
            />
          </label>

          <label className="form-field">
            <span>Duración (minutos)</span>
            <input
              className="input"
              name="duracion_minutos"
              type="number"
              min="10"
              step="5"
              value={form.duracion_minutos}
              onChange={handleChange}
            />
          </label>

          <label className="form-field form-field--full">
            <span>Dirección</span>
            <input
              className="input"
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-field form-field--full">
            <span>Tipo de servicio</span>
            <input
              className="input"
              name="tipo_servicio"
              value={form.tipo_servicio}
              onChange={handleChange}
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

      <Modal
        open={confirmDeleteOpen}
        title="Confirmar eliminación"
        onClose={cancelDelete}
      >
        <p>
          ¿Seguro que quieres eliminar esta visita
          {visitaToDelete?.cliente_nombre
            ? ` de "${visitaToDelete.cliente_nombre}"`
            : ""}?
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

      <Modal
        open={detailsOpen}
        title="Detalle de la visita"
        onClose={closeDetails}
      >
        {visitaDetalle && (
          <div className="detalle-grid">
            <div>
              <p className="detalle-label">Cliente</p>
              <p className="detalle-value">
                {visitaDetalle.cliente_nombre || "Cliente sin nombre"}
              </p>
            </div>
            <div>
              <p className="detalle-label">Fecha</p>
              <p className="detalle-value">
                {visitaDetalle.fecha?.slice(0, 10) || "—"}
              </p>
            </div>
            <div>
              <p className="detalle-label">Día</p>
              <p className="detalle-value">
                {capitalizar(
                  (visitaDetalle.dia_semana || "").toString().toLowerCase()
                ) || "—"}
              </p>
            </div>
            <div>
              <p className="detalle-label">Hora</p>
              <p className="detalle-value">
                {visitaDetalle.hora || "—"}
              </p>
            </div>
            <div>
              <p className="detalle-label">Duración</p>
              <p className="detalle-value">
                {visitaDetalle.duracion_minutos || 0} min
              </p>
            </div>
            <div className="detalle-full">
              <p className="detalle-label">Dirección</p>
              <p className="detalle-value detalle-value--multiline">
                {visitaDetalle.direccion || "Sin dirección registrada."}
              </p>
            </div>
            <div className="detalle-full">
              <p className="detalle-label">Tipo de servicio</p>
              <p className="detalle-value">
                {visitaDetalle.tipo_servicio || "Sin tipo de servicio."}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RutasPage;
