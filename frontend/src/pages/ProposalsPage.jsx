import React, { useEffect, useState } from "react";
import api from "../api/apiClient";
import Modal from "../components/Modal";
import SearchableSelect from "../components/SearchableSelect";
import ProposalPreview from "./ProposalsPage/ProposalPreview";
import { useLanguage } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";

const MONEDAS = ["USD", "EUR", "MXN", "PAB", "COP"];

const ProposalsPage = () => {
  const { lang } = useLanguage();
  const [estimados, setEstimados] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState(null);
  const [form, setForm] = useState({
    cliente_id: "",
    direccion_trabajo: "",
    fecha: new Date().toISOString().slice(0, 10),
    monto: "",
    moneda: "USD",
    descripcion_trabajo: "",
    estado: "borrador",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [resClientes, resEstimados] = await Promise.all([
        api.get("/clientes"),
        api.get("/estimados"),
      ]);
      setClientes(resClientes.data || []);
      const data = resEstimados.data || [];
      setEstimados(data);
      setSelectedId((current) => data.some((item) => item.id === current) ? current : data[0]?.id || null);
    } catch (err) {
      console.error("Error cargando proposals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewModal = () => {
    setEditingProposal(null);
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

  const getEditableDescription = (proposal) => {
    const rawDescription = (proposal.descripcion_trabajo || "").trim();
    const notes = (proposal.notas_adicionales || "").trim();
    const lines = rawDescription.split("\n").filter((line) => line.trim());
    const looksLikeOldMaterials =
      lines.length > 0 &&
      lines.every((line) => /^(\d+)x\s+.+\s+\(\$[\d.]+\s+c\/u\)$/.test(line.trim()));

    if (notes && (!rawDescription || looksLikeOldMaterials)) return notes;
    return rawDescription;
  };

  const openEditModal = (proposal) => {
    setEditingProposal(proposal);
    setForm({
      cliente_id: proposal.cliente_id || "",
      direccion_trabajo: proposal.direccion_trabajo || "",
      fecha: (proposal.fecha || "").slice(0, 10),
      monto: proposal.monto ?? "",
      moneda: proposal.moneda || "USD",
      descripcion_trabajo: getEditableDescription(proposal),
      estado: proposal.estado || "borrador",
    });
    setModalOpen(true);
  };

  const askDelete = (proposal) => {
    setProposalToDelete(proposal);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!proposalToDelete) return;

    try {
      await api.delete(`/estimados/${proposalToDelete.id}`);
      setConfirmDeleteOpen(false);
      setProposalToDelete(null);
      await loadData();
    } catch (err) {
      console.error("Error eliminando proposal", err);
      alert("No se pudo eliminar el proposal.");
    }
  };

  const handleChange = (ev) => {
    const { name, value } = ev.target;
    setForm((f) => {
      const next = { ...f, [name]: value };
      if (name === "cliente_id") {
        const selectedClient = clientes.find((cliente) => cliente.id === Number(value));
        if (selectedClient && !f.direccion_trabajo) {
          next.direccion_trabajo = selectedClient.direccion || "";
        }
      }
      return next;
    });
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const monto = Number(form.monto) || 0;
    const payload = {
      cliente_id: form.cliente_id,
      direccion_trabajo: form.direccion_trabajo,
      fecha: form.fecha,
      monto,
      moneda: form.moneda,
      descripcion_trabajo: form.descripcion_trabajo,
      notas_adicionales: "",
      estado: form.estado,
    };

    try {
      const res = editingProposal
        ? await api.put(`/estimados/${editingProposal.id}`, payload)
        : await api.post("/estimados", payload);
      setModalOpen(false);
      setEditingProposal(null);
      await loadData();
      if (res.data?.id || editingProposal?.id) {
        setSelectedId(res.data?.id || editingProposal.id);
      } else if (res.data?.id) {
        setSelectedId(res.data.id);
      }
    } catch (err) {
      console.error("Error guardando proposal", err);
      alert("No se pudo guardar el proposal.");
    }
  };

  const filteredEstimados = estimados.filter((estimado) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (estimado.cliente_nombre || "").toLowerCase().includes(q) ||
      (estimado.direccion_trabajo || "").toLowerCase().includes(q) ||
      (estimado.descripcion_trabajo || "").toLowerCase().includes(q) ||
      String(estimado.monto || "").toLowerCase().includes(q)
    );
  });

  const selectedProposal =
    estimados.find((estimado) => estimado.id === selectedId) ||
    filteredEstimados[0] ||
    null;

  return (
    <div className="page page--proposal">
      <header className="page-header">
        <div className="page-header-main">
          <h2 className="page-title">{t(lang, "proposals")}</h2>
          <p className="page-subtitle">{t(lang, "proposals_page_subtitle")}</p>
        </div>
        <div className="page-header-actions">
          {selectedProposal && (
            <>
              <button className="btn-ghost" onClick={() => openEditModal(selectedProposal)}>
                {t(lang, "editar")}
              </button>
              <button className="btn-danger-ghost" onClick={() => askDelete(selectedProposal)}>
                {t(lang, "eliminar")}
              </button>
            </>
          )}
          <button className="btn-primary" onClick={openNewModal}>
            + {t(lang, "nuevo_estimado")}
          </button>
        </div>
      </header>

      <div className="proposal-layout">
        <aside className="proposal-selector">
          <div className="proposal-selector-header">
            <input
              className="input search-bar"
              placeholder={t(lang, "busqueda")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="muted">{t(lang, "cargando")}</p>
          ) : filteredEstimados.length === 0 ? (
            <p className="muted">{t(lang, "sin_resultados")}</p>
          ) : (
            <div className="proposal-selector-list">
              {filteredEstimados.map((estimado) => (
                <button
                  key={estimado.id}
                  className={
                    "proposal-selector-card" +
                    (selectedProposal?.id === estimado.id
                      ? " proposal-selector-card--active"
                      : "")
                  }
                  onClick={() => setSelectedId(estimado.id)}
                >
                  <span className="proposal-selector-name">
                    {estimado.cliente_nombre || t(lang, "cliente_sin_nombre")}
                  </span>
                  <span className="proposal-selector-meta">
                    {estimado.fecha?.slice(0, 10) || t(lang, "sin_fecha")}
                  </span>
                  <span className="proposal-selector-meta">
                    {estimado.moneda} {Number(estimado.monto || 0).toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="proposal-preview-panel">
          {selectedProposal ? (
            <ProposalPreview estimado={selectedProposal} />
          ) : (
            <div className="card">
              <p className="muted">{t(lang, "proposals_no_proposals")}</p>
            </div>
          )}
        </section>
      </div>

      <Modal
        open={modalOpen}
        title={editingProposal ? t(lang, "editar_estimado_title") : t(lang, "nuevo_estimado_title")}
        onClose={() => { setModalOpen(false); setEditingProposal(null); }}
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
                  options={clientes.map((c) => ({ value: c.id, label: c.nombre }))}
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
            <h3 className="items-form-title">{t(lang, "descripcion_trabajo")}</h3>
            <div className="items-form-grid">
              <label className="form-field form-field--full">
                <span>{t(lang, "descripcion")}</span>
                <textarea
                  className="input"
                  name="descripcion_trabajo"
                  value={form.descripcion_trabajo}
                  onChange={handleChange}
                  rows={8}
                  placeholder={t(lang, "descripcion_trabajo_placeholder")}
                  required
                />
              </label>
            </div>
          </div>

          <div className="items-form-footer">
            <label className="form-field">
              <span>{t(lang, "monto")}</span>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                name="monto"
                value={form.monto}
                onChange={handleChange}
                placeholder="0.00"
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
                <option value="borrador">{t(lang, "borrador")}</option>
                <option value="enviado">{t(lang, "enviado")}</option>
                <option value="aceptado">{t(lang, "aceptado")}</option>
                <option value="rechazado">{t(lang, "rechazado")}</option>
              </select>
            </label>
            <label className="form-field">
              <span>{t(lang, "moneda")}</span>
              <select
                className="input"
                name="moneda"
                value={form.moneda}
                onChange={handleChange}
              >
                {MONEDAS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
            <span className="items-grand-total">
              {form.moneda} {Number(form.monto || 0).toFixed(2)}
            </span>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => { setModalOpen(false); setEditingProposal(null); }}
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
        onClose={() => setConfirmDeleteOpen(false)}
      >
        <p>
          {t(lang, "seguro_eliminar_estimado")} {proposalToDelete?.cliente_nombre || ""}?
        </p>
        <div className="form-actions" style={{ marginTop: "1rem" }}>
          <button type="button" className="btn-ghost" onClick={() => setConfirmDeleteOpen(false)}>
            {t(lang, "cancelar")}
          </button>
          <button type="button" className="btn btn-danger" onClick={confirmDelete}>
            {t(lang, "si_eliminar")}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ProposalsPage;
