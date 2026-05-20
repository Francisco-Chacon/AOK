// src/pages/InvoicePage.jsx
import React, { useEffect, useState } from "react";
import api from "../api/apiClient";
import Modal from "../components/Modal";
import SearchableSelect from "../components/SearchableSelect";
import InvoiceScreen from "./InvoicePage/InvoiceScreen";
import { useLanguage } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";

const InvoicePage = () => {
  const { lang } = useLanguage();
  const [facturas, setFacturas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingFactura, setEditingFactura] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [facturaToDelete, setFacturaToDelete] = useState(null);

  const [form, setForm] = useState({
    cliente_id: "",
    fecha: "",
    estado: "pendiente",
    nota: "",
  });
  const [items, setItems] = useState([{ fecha: "", descripcion: "", cantidad: 1, precio: "" }]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resFacturas, resClientes] = await Promise.all([
        api.get("/facturas"),
        api.get("/clientes"),
      ]);
      setFacturas(resFacturas.data || []);
      setClientes(resClientes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtradas = facturas.filter(f => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (f.cliente_nombre || "").toLowerCase().includes(q) ||
      (f.nota || "").toLowerCase().includes(q) ||
      (f.estado || "").toLowerCase().includes(q)
    );
  });

  const openNewModal = () => {
    setEditingFactura(null);
    setForm({ cliente_id: "", fecha: new Date().toISOString().slice(0, 10), estado: "pendiente", nota: "" });
    setItems([{ fecha: new Date().toISOString().slice(0, 10), descripcion: "", cantidad: 1, precio: "" }]);
    setModalOpen(true);
  };

  const openEditModal = (f) => {
    setEditingFactura(f);
    setForm({
      cliente_id: f.cliente_id || "",
      fecha: (f.fecha || "").slice(0, 10),
      estado: f.estado || "pendiente",
      nota: f.nota || "",
    });
    setItems(f.items?.length > 0 ? f.items.map(i => ({
      fecha: i.fecha || "",
      descripcion: i.descripcion || "",
      cantidad: i.cantidad || 1,
      precio: i.precio || "",
    })) : [{ fecha: "", descripcion: "", cantidad: 1, precio: "" }]);
    setModalOpen(true);
  };

  const openPreview = async (f) => {
    try {
      const res = await api.get(`/facturas/${f.id}`);
      setPreviewData(res.data);
      setPreviewOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleItemChange = (i, field, value) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const addItem = () => {
    setItems(prev => [...prev, { fecha: form.fecha || new Date().toISOString().slice(0,10), descripcion: "", cantidad: 1, precio: "" }]);
  };

  const removeItem = (i) => {
    setItems(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      items: items.map(i => ({
        ...i,
        precio: Number(i.precio) || 0,
        cantidad: Number(i.cantidad) || 1,
      })),
    };
    try {
      if (editingFactura) {
        await api.put(`/facturas/${editingFactura.id}`, payload);
      } else {
        await api.post("/facturas", payload);
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Error saving invoice.");
    }
  };

  const askDelete = (f) => { setFacturaToDelete(f); setConfirmDeleteOpen(true); };
  const confirmDelete = async () => {
    if (!facturaToDelete) return;
    try {
      await api.delete(`/facturas/${facturaToDelete.id}`);
      await loadData();
    } catch (err) { console.error(err); }
    finally { setConfirmDeleteOpen(false); setFacturaToDelete(null); }
  };

  const total = items.reduce((sum, i) => sum + (Number(i.precio) || 0) * (Number(i.cantidad) || 1), 0);

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header-main">
          <h2 className="page-title">{t(lang, "facturas")}</h2>
          <p className="page-subtitle">{t(lang, "facturas_page_subtitle")}</p>
        </div>
        <button className="btn-primary" onClick={openNewModal}>+ {t(lang, "nueva_factura")}</button>
      </header>

      <div className="page-toolbar">
        <input className="input search-bar" placeholder={t(lang, "busqueda")} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      {loading ? (
        <p className="muted">{t(lang, "cargando")}</p>
      ) : filtradas.length === 0 ? (
        <p className="muted">{t(lang, "sin_resultados")}</p>
      ) : (
        <div className="list">
          {filtradas.map(f => (
            <article key={f.id} className="card card--clickable" onClick={() => openPreview(f)}>
              <div className="card-main">
                <div className="badge-row">
                  <span className="badge badge-soft">INV-{f.id}</span>
                  <span className={`badge ${f.estado === "pagado" ? "badge-success" : f.estado === "pendiente" ? "badge-warning" : "badge-muted"}`}>{f.estado}</span>
                </div>
                <h3 className="card-title">{f.cliente_nombre || t(lang, "cliente_sin_nombre")}</h3>
                <p className="card-text muted">{f.nota ? f.nota.slice(0, 120) + (f.nota.length > 120 ? "…" : "") : ""}</p>
              </div>
              <div className="card-meta">
                <p className="card-text"><strong>{t(lang, "fecha")}:</strong> {f.fecha?.slice(0, 10)}</p>
                <p className="card-text"><strong>{t(lang, "monto")}:</strong> ${(f.items || []).reduce((s, i) => s + (Number(i.precio) || 0) * (Number(i.cantidad) || 1), 0).toFixed(2)}</p>
                <div className="card-actions">
                  <button className="btn-ghost" onClick={e => { e.stopPropagation(); openEditModal(f); }}>{t(lang, "editar")}</button>
                  <button className="btn-danger-ghost" onClick={e => { e.stopPropagation(); askDelete(f); }}>{t(lang, "eliminar")}</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal create/edit */}
      <Modal open={modalOpen} title={editingFactura ? t(lang, "editar_factura_title") : t(lang, "nueva_factura_title")} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="form-field">
              <span>{t(lang, "cliente")}</span>
              <SearchableSelect
                value={form.cliente_id}
                onChange={(e) => { setForm(f => ({ ...f, cliente_id: e.target.value })); }}
                options={clientes.map(c => ({ value: c.id, label: c.nombre }))}
                placeholder={t(lang, "seleccionar_cliente")}
              />
            </label>
            <label className="form-field">
              <span>{t(lang, "fecha")}</span>
              <input className="input" type="date" name="fecha" value={form.fecha} onChange={handleChange} required />
            </label>
            <label className="form-field">
              <span>{t(lang, "estado")}</span>
              <select className="input" name="estado" value={form.estado} onChange={handleChange}>
                <option value="pendiente">{t(lang, "pendiente")}</option>
                <option value="pagado">{t(lang, "pagado")}</option>
                <option value="cancelado">{t(lang, "cancelado")}</option>
              </select>
            </label>
            <label className="form-field form-field--full">
              <span>{t(lang, "nota")}</span>
              <textarea className="input" name="nota" value={form.nota} onChange={handleChange} rows={2} />
            </label>
          </div>

          <div className="items-form">
            <div className="items-form-section">
              <div className="items-form-title">{t(lang, "items_factura")}</div>
              {items.map((item, i) => (
                <div key={i} className="items-input-row" style={{ marginBottom: "0.5rem" }}>
                  <div className="items-input-field">
                    <span>{t(lang, "fecha")}</span>
                    <input className="input" type="date" value={item.fecha} onChange={e => handleItemChange(i, "fecha", e.target.value)} style={{ width: "130px" }} />
                  </div>
                  <div className="items-input-field items-input-desc">
                    <span>{t(lang, "descripcion")}</span>
                    <input className="input" value={item.descripcion} onChange={e => handleItemChange(i, "descripcion", e.target.value)} placeholder={t(lang, "descripcion_trabajo")} />
                  </div>
                  <div className="items-input-field">
                    <span>{t(lang, "cantidad")}</span>
                    <input className="input" type="number" min="1" value={item.cantidad} onChange={e => handleItemChange(i, "cantidad", e.target.value)} style={{ width: "70px" }} />
                  </div>
                  <div className="items-input-field">
                    <span>{t(lang, "precio_unit")}</span>
                    <input className="input" type="number" step="0.01" value={item.precio} onChange={e => handleItemChange(i, "precio", e.target.value)} style={{ width: "90px" }} />
                  </div>
                  <button type="button" className="btn-remove-item" onClick={() => removeItem(i)}>×</button>
                </div>
              ))}
              <button type="button" className="btn-add-item" onClick={addItem} style={{ marginTop: "0.5rem" }}>+</button>
            </div>

            <div className="items-form-footer">
              <div className="items-form-footer-left">
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{t(lang, "items")}: {items.length}</span>
              </div>
              <div className="items-form-footer-right">
                <span className="items-total-label">{t(lang, "total")}:</span>
                <span className="items-grand-total">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>{t(lang, "cancelar")}</button>
            <button type="submit" className="btn-primary">{t(lang, "guardar")}</button>
          </div>
        </form>
      </Modal>

      {/* Preview modal */}
      <Modal open={previewOpen} title={t(lang, "vista_previa_factura")} onClose={() => setPreviewOpen(false)} wide>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
          <button className="btn-outline" onClick={() => window.print()}>{t(lang, "imprimir")}</button>
        </div>
        {previewData && <InvoiceScreen data={previewData} />}
      </Modal>

      {/* Confirm delete */}
      <Modal open={confirmDeleteOpen} title={t(lang, "confirmar_eliminar")} onClose={() => setConfirmDeleteOpen(false)}>
        <p>{t(lang, "seguro_eliminar_factura")} INV-{facturaToDelete?.id}?</p>
        <div className="form-actions">
          <button className="btn-ghost" onClick={() => setConfirmDeleteOpen(false)}>{t(lang, "cancelar")}</button>
          <button className="btn btn-danger" onClick={confirmDelete}>{t(lang, "si_eliminar")}</button>
        </div>
      </Modal>
    </div>
  );
};

export default InvoicePage;