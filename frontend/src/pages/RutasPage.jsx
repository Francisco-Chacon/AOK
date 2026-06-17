// src/pages/RutasPage.jsx
import React, { useEffect, useState } from "react";
import api from "../api/apiClient";
import Modal from "../components/Modal";
import SearchableSelect from "../components/SearchableSelect";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import { SkeletonCard } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { useLanguage } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";

const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const DIAS_FILTRO = ["todos", ...DIAS];

const RutasPage = () => {
  const { lang } = useLanguage();
  const toast = useToast();
  const [visitas, setVisitas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [diaActivo, setDiaActivo] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const LIMIT = 20;
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [debouncedQuery, diaActivo]);

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
    Promise.all([api.get("/visitas"), api.get("/clientes")]).then(([resVisitas, resClientes]) => {
      setVisitas(resVisitas.data || []);
      setClientes(resClientes.data || []);
    }).catch((err) => console.error("Error cargando visitas", err)).finally(() => setLoading(false));
  }, []);

  const visitasPorDia = (dia) =>
    visitas.filter((v) => {
      const raw = (v.dia_semana ?? "").toString().toLowerCase().trim();
      return raw === dia;
    });

  const visitasFiltradas = visitas.filter((v) => {
    if (diaActivo !== "todos") {
      const raw = (v.dia_semana ?? "").toString().toLowerCase().trim();
      if (raw !== diaActivo) return false;
    }
    if (!debouncedQuery) return true;
    const q = debouncedQuery.toLowerCase();
    return (
      (v.cliente_nombre || "").toLowerCase().includes(q) ||
      (v.direccion || "").toLowerCase().includes(q) ||
      (v.tipo_servicio || "").toLowerCase().includes(q) ||
      (v.hora || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(visitasFiltradas.length / LIMIT);
  const paginated = visitasFiltradas.slice((page - 1) * LIMIT, page * LIMIT);

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
        toast("Visita actualizada correctamente.", "success");
      } else {
        await api.post("/visitas", payload);
        toast("Visita creada correctamente.", "success");
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error guardando visita", err);
      toast("No se pudo guardar la visita.", "error");
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
      toast("Visita eliminada correctamente.", "success");
      await loadData();
    } catch (err) {
      console.error("Error eliminando visita", err);
      toast("No se pudo eliminar la visita.", "error");
    } finally {
      setConfirmDeleteOpen(false);
      setVisitaToDelete(null);
    }
  };

  const capitalizar = (txt) =>
    txt ? txt.charAt(0).toUpperCase() + txt.slice(1) : "";

  return (
    <div className="page mx-auto w-full max-w-6xl">
      <header className="page-header mb-6 flex items-center justify-between gap-4 rounded-3xl border border-[var(--record-border)] bg-[var(--bg-panel)] px-5 py-5 shadow-[var(--shadow-soft)] backdrop-blur">
        <div className="page-header-main flex flex-col gap-1">
          <h2 className="page-title text-3xl font-bold tracking-[-0.035em] text-[var(--text-main)]">{t(lang, "rutas")}</h2>
          <p className="page-subtitle text-sm text-[var(--text-muted)]">
            {t(lang, "rutas_page_subtitle")}
          </p>
        </div>
        <button className="btn-primary" onClick={openNewModal}>
          + {t(lang, "nueva_visita")}
        </button>
      </header>

      <p className="muted" style={{ marginBottom: "0.5rem" }}>
        {t(lang, "total_visitas")} {visitas.length}
      </p>

      <section className="stats-grid stats-grid--scroll">
        {DIAS.map((dia) => (
          <div key={dia} className="stat-card">
            <span className="stat-label">{capitalizar(dia)}</span>
            <span className="stat-value">
              {visitasPorDia(dia).length} {t(lang, "visitas")}
            </span>
          </div>
        ))}
      </section>

      <div className="page-toolbar mb-5 flex items-center justify-between gap-4">
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t(lang, "busqueda")}
        />
        <div className="pill-group">
          {DIAS_FILTRO.map((diaKey) => (
            <button
              key={diaKey}
              className={"pill" + (diaActivo === diaKey ? " pill--active" : "")}
              onClick={() => setDiaActivo(diaKey)}
            >
              {diaKey === "todos" ? t(lang, "todos") : capitalizar(diaKey)}
            </button>
          ))}
        </div>
        <span className="muted">
          {diaActivo === "todos"
            ? `${visitas.length} ${t(lang, "visitas_total")}`
            : `${visitasFiltradas.length} ${t(lang, "visitas_para")} ${capitalizar(
                diaActivo
              )}`}
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : visitasFiltradas.length === 0 ? (
        <p className="muted">
          {diaActivo === "todos"
            ? t(lang, "sin_visitas")
            : t(lang, "sin_visitas_dia")}
        </p>
      ) : (
        <div className="list flex flex-col gap-3">
          {paginated.map((v) => (
            <article
              key={v.id}
              className="card card--wide card--clickable flex cursor-pointer items-center justify-between gap-5 rounded-xl border border-[var(--record-border)] bg-[var(--bg-card)] p-5 shadow-[var(--record-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--record-border-strong)] hover:shadow-[var(--record-shadow-hover)]"
              onClick={() => openDetails(v)}
            >
              <div className="card-main flex flex-col gap-1">
                <div className="badge-row flex items-center gap-1.5">
                  <span className="pill pill--soft">
                    {v.fecha ? v.fecha.slice(0, 10) : t(lang, "sin_fecha")}
                  </span>
                  <span className="pill pill--soft">{v.hora}</span>
                  <span className="pill pill--soft">
                    {v.duracion_minutos} {t(lang, "minutos")}
                  </span>
                </div>
                <h3 className="card-title">
                  {v.cliente_nombre || t(lang, "cliente_sin_nombre")}
                </h3>
                <p className="card-text">{v.direccion}</p>
              </div>
              <div className="card-meta flex min-w-40 flex-col items-end gap-1.5">
                <span className="badge badge-soft">
                  {v.tipo_servicio || t(lang, "servicio")}
                </span>
                <div className="card-actions">
                  <button
                    className="btn-action btn-action--edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(v);
                    }}
                  >
                    <svg className="btn-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                    {t(lang, "editar")}
                  </button>
                  <button
                    className="btn-action btn-action--delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      askDelete(v);
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

      {visitasFiltradas.length > 0 && (
        <Pagination page={page} totalPages={totalPages} total={visitasFiltradas.length} limit={LIMIT} onPageChange={setPage} />
      )}

      <Modal
        open={modalOpen}
        title={editingVisita ? t(lang, "editar_visita_title") : t(lang, "nueva_visita_title")}
        onClose={() => setModalOpen(false)}
      >
        <form className="form-grid grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
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
            <span>{t(lang, "hora")}</span>
            <input
              className="input"
              name="hora"
              type="time"
              value={form.hora}
              onChange={handleChange}
            />
          </label>

          <label className="form-field">
            <span>{t(lang, "duracion")}</span>
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
            <span>{t(lang, "direccion")}</span>
            <input
              className="input"
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-field form-field--full">
            <span>{t(lang, "tipo_servicio")}</span>
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
              {t(lang, "cancelar")}
            </button>
            <button type="submit" className="btn-primary">
              {t(lang, "guardar")}
            </button>
          </div>
        </form>
      </Modal>

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
            {t(lang, "seguro_eliminar_visita")}
            {visitaToDelete?.cliente_nombre
              ? <span className="font-bold"> de "{visitaToDelete.cliente_nombre}"</span>
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

      <Modal
        open={detailsOpen}
        title={t(lang, "detalle_visita")}
        onClose={closeDetails}
      >
        {visitaDetalle && (
          <div className="detalle-grid">
            <div>
              <p className="detalle-label">{t(lang, "cliente")}</p>
              <p className="detalle-value">
                {visitaDetalle.cliente_nombre || t(lang, "cliente_sin_nombre")}
              </p>
            </div>
            <div>
              <p className="detalle-label">{t(lang, "fecha")}</p>
              <p className="detalle-value">
                {visitaDetalle.fecha?.slice(0, 10) || "—"}
              </p>
            </div>
            <div>
              <p className="detalle-label">{t(lang, "dia")}</p>
              <p className="detalle-value">
                {capitalizar(
                  (visitaDetalle.dia_semana || "").toString().toLowerCase()
                ) || "—"}
              </p>
            </div>
            <div>
              <p className="detalle-label">{t(lang, "hora")}</p>
              <p className="detalle-value">
                {visitaDetalle.hora || "—"}
              </p>
            </div>
            <div>
              <p className="detalle-label">{t(lang, "duracion")}</p>
              <p className="detalle-value">
                {visitaDetalle.duracion_minutos || 0} {t(lang, "minutos")}
              </p>
            </div>
            <div className="detalle-full">
              <p className="detalle-label">{t(lang, "direccion")}</p>
              <p className="detalle-value detalle-value--multiline">
                {visitaDetalle.direccion || t(lang, "sin_direccion")}
              </p>
            </div>
            <div className="detalle-full">
              <p className="detalle-label">{t(lang, "tipo_servicio")}</p>
              <p className="detalle-value">
                {visitaDetalle.tipo_servicio || t(lang, "sin_tipo_servicio")}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RutasPage;
