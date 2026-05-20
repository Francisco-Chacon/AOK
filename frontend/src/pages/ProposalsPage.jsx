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

  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({
    descripcion: "",
    cantidad: 1,
    precio_unitario: "",
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
      setSelectedId((current) => current || data[0]?.id || null);
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
    setItems([]);
    setNewItem({ descripcion: "", cantidad: 1, precio_unitario: "" });
    setModalOpen(true);
  };

  const handleChange = (ev) => {
    const { name, value } = ev.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleNewItemChange = (ev) => {
    const { name, value } = ev.target;
    setNewItem((item) => ({ ...item, [name]: value }));
  };

  const addItem = () => {
    if (!newItem.descripcion || !newItem.precio_unitario) {
      alert("Completa descripción y precio unitario");
      return;
    }
    const item = {
      ...newItem,
      cantidad: Number(newItem.cantidad) || 1,
      precio_unitario: Number(newItem.precio_unitario) || 0,
      total: (Number(newItem.cantidad) || 1) * (Number(newItem.precio_unitario) || 0),
    };
    setItems((prev) => [...prev, item]);
    setNewItem({ descripcion: "", cantidad: 1, precio_unitario: "" });
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => acc + (item.total || 0), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const itbms = subtotal * 0.07;
    return subtotal + itbms;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const subtotal = calculateSubtotal();
    const total = calculateTotal();
    const descripcionItems = items.map((i) => `${i.cantidad}x ${i.descripcion} ($${i.precio_unitario} c/u)`).join("\n");
    const notasAdicionales = form.descripcion_trabajo || "";
    const payload = {
      cliente_id: form.cliente_id,
      direccion_trabajo: form.direccion_trabajo,
      fecha: form.fecha,
      monto: total,
      moneda: form.moneda,
      descripcion_trabajo: descripcionItems,
      notas_adicionales: notasAdicionales,
      estado: form.estado,
    };

    try {
      const res = await api.post("/estimados", payload);
      setModalOpen(false);
      await loadData();
      if (res.data?.id) {
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
        <button className="btn-primary" onClick={openNewModal}>
          + {t(lang, "nuevo_estimado")}
        </button>
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
        title={t(lang, "nuevo_estimado_title")}
        onClose={() => setModalOpen(false)}
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
            <h3 className="items-form-title">{t(lang, "agregar_materials")}</h3>
            <div className="items-input-row">
              <div className="items-input-field items-input-desc">
                <span>{t(lang, "descripcion")}</span>
                <input
                  className="input"
                  name="descripcion"
                  value={newItem.descripcion}
                  onChange={handleNewItemChange}
                  placeholder={t(lang, "ejemplo_material")}
                />
              </div>
              <div className="items-input-field">
                <span>{t(lang, "cantidad")}</span>
                <input
                  className="input"
                  type="number"
                  name="cantidad"
                  value={newItem.cantidad}
                  onChange={handleNewItemChange}
                  min="1"
                />
              </div>
              <div className="items-input-field">
                <span>{t(lang, "precio_unit")}</span>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  name="precio_unitario"
                  value={newItem.precio_unitario}
                  onChange={handleNewItemChange}
                  placeholder="0.00"
                />
              </div>
              <button type="button" className="btn-add-item" onClick={addItem}>
                +
              </button>
            </div>
          </div>

          <div className="items-form-section">
            <h3 className="items-form-title">{t(lang, "materials_agregados")}</h3>
            {items.length === 0 ? (
              <p className="muted">{t(lang, "sin_materials")}</p>
            ) : (
              <table className="items-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t(lang, "descripcion")}</th>
                    <th>{t(lang, "cantidad")}</th>
                    <th>{t(lang, "precio_unit")}</th>
                    <th>{t(lang, "total")}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{item.descripcion}</td>
                      <td>{item.cantidad}</td>
                      <td>${Number(item.precio_unitario || 0).toFixed(2)}</td>
                      <td>
                        ${Number(item.total || item.cantidad * item.precio_unitario || 0).toFixed(2)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-remove-item"
                          onClick={() => removeItem(index)}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="items-total-label">
                      {t(lang, "subtotal")}
                    </td>
                    <td className="items-total-value">
                      ${calculateSubtotal().toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="items-total-label">
                      {t(lang, "impuesto")} (7%)
                    </td>
                    <td className="items-total-value">
                      ${(calculateSubtotal() * 0.07).toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="items-total-label">
                      {t(lang, "total")}
                    </td>
                    <td className="items-total-value">
                      ${calculateTotal().toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          <div className="items-form-section">
            <h3 className="items-form-title">{t(lang, "notas_adicionales_trabajo")}</h3>
            <div className="items-form-grid">
              <label className="form-field form-field--full">
                <span>{t(lang, "descripcion_trabajo")}</span>
                <textarea
                  className="input"
                  name="descripcion_trabajo"
                  value={form.descripcion_trabajo}
                  onChange={handleChange}
                  rows={3}
                  placeholder={t(lang, "descripcion_trabajo_placeholder")}
                />
              </label>
            </div>
          </div>

          <div className="items-form-footer">
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
            <div style={{ textAlign: "right" }}>
              <div className="muted" style={{ fontSize: "0.8rem" }}>
                {t(lang, "subtotal")}: ${calculateSubtotal().toFixed(2)} {form.moneda}
              </div>
              <div className="muted" style={{ fontSize: "0.8rem" }}>
                {t(lang, "impuesto")} (7%): ${(calculateSubtotal() * 0.07).toFixed(2)} {form.moneda}
              </div>
              <span className="items-grand-total">
                {t(lang, "total")}: ${calculateTotal().toFixed(2)} {form.moneda}
              </span>
            </div>
          </div>

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
    </div>
  );
};

export default ProposalsPage;