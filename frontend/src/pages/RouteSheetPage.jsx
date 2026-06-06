// src/pages/RouteSheetPage.jsx
import React, { useEffect, useState } from "react";
import api from "../api/apiClient";
import Modal from "../components/Modal";
import SearchableSelect from "../components/SearchableSelect";
import RouteSheetScreen from "./RouteSheetPage/RouteSheetScreen";
import { useLanguage } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";
import { sanitizeHtml } from "../utils/sanitize";

const RouteSheetPage = () => {
  const { lang } = useLanguage();
  const [hojas, setHojas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingHoja, setEditingHoja] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [hojaToDelete, setHojaToDelete] = useState(null);

  const [form, setForm] = useState({ fecha: "", conductor: "", camion: "" });
  const [clientesHoja, setClientesHoja] = useState([
    { cliente_id: "", cliente_nombre: "", cliente_direccion: "", hora_entrada: "", hora_salida: "", descripcion: "" }
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resHojas, resClientes] = await Promise.all([
        api.get("/rutas-hojas"),
        api.get("/clientes"),
      ]);
      setHojas(resHojas.data || []);
      setClientes(resClientes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtradas = hojas.filter(h => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (h.conductor || "").toLowerCase().includes(q) ||
      (h.camion || "").toLowerCase().includes(q) ||
      (h.fecha || "").includes(q)
    );
  });

  const openNewModal = () => {
    setEditingHoja(null);
    setForm({ fecha: new Date().toISOString().slice(0, 10), conductor: "", camion: "" });
    setClientesHoja([{ cliente_id: "", cliente_nombre: "", cliente_direccion: "", hora_entrada: "", hora_salida: "", descripcion: "" }]);
    setModalOpen(true);
  };

  const openEditModal = (h) => {
    setEditingHoja(h);
    setForm({ fecha: (h.fecha || "").slice(0, 10), conductor: h.conductor || "", camion: h.camion || "" });
    setClientesHoja((h.clientes && h.clientes.length > 0) ? h.clientes.map(c => ({
      cliente_id: c.cliente_id || "",
      cliente_nombre: c.cliente_nombre || "",
      cliente_direccion: c.cliente_direccion || "",
      hora_entrada: c.hora_entrada || "",
      hora_salida: c.hora_salida || "",
      descripcion: c.descripcion || "",
    })) : [{ cliente_id: "", cliente_nombre: "", cliente_direccion: "", hora_entrada: "", hora_salida: "", descripcion: "" }]);
    setModalOpen(true);
  };

  const openPreview = async (h) => {
    try {
      const res = await api.get(`/rutas-hojas/${h.id}`);
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

  const handleClienteChange = (i, field, value) => {
    setClientesHoja(prev => {
      const updated = prev.map((c, idx) => {
        if (idx !== i) return c;
        const nc = { ...c, [field]: value };
        if (field === "cliente_id") {
          const sel = clientes.find(cl => cl.id === Number(value));
          if (sel) {
            nc.cliente_nombre = sel.nombre;
            nc.cliente_direccion = sel.direccion || "";
          }
        }
        return nc;
      });
      return updated;
    });
  };

  const addCliente = () => {
    setClientesHoja(prev => [...prev, { cliente_id: "", cliente_nombre: "", cliente_direccion: "", hora_entrada: "", hora_salida: "", descripcion: "" }]);
  };

  const removeCliente = (i) => {
    setClientesHoja(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, clientes: clientesHoja };
    try {
      if (editingHoja) {
        await api.put(`/rutas-hojas/${editingHoja.id}`, payload);
      } else {
        await api.post("/rutas-hojas", payload);
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Error saving route sheet.");
    }
  };

  const askDelete = (h) => { setHojaToDelete(h); setConfirmDeleteOpen(true); };
  const confirmDelete = async () => {
    if (!hojaToDelete) return;
    try {
      await api.delete(`/rutas-hojas/${hojaToDelete.id}`);
      await loadData();
    } catch (err) { console.error(err); }
    finally { setConfirmDeleteOpen(false); setHojaToDelete(null); }
  };

  const printRouteSheet = (routeSheet) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const s = sanitizeHtml;
    const rows = routeSheet.clientes?.length > 0
      ? [...routeSheet.clientes, ...Array.from({ length: Math.max(0, 8 - routeSheet.clientes.length) }, () => ({}))]
      : Array.from({ length: 8 }, () => ({}));

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Route Sheet - ${s(routeSheet.fecha || "")}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #fff; color: #111; font-family: Arial, Helvetica, sans-serif; }
    .route-sheet-page { width: 8.5in; min-height: 11in; padding: 0.45in; margin: 0 auto; }
    .invoice-header { display: flex; justify-content: center; align-items: center; gap: 18px; margin-bottom: 8px; }
    .invoice-logo { width: 140px; height: auto; object-fit: contain; }
    .invoice-company-info { text-align: center; line-height: 1.1; }
    .invoice-company-info h1 { margin: 0; font-size: 28px; letter-spacing: 2px; color: #700e0c; font-weight: 900; }
    .invoice-company-info h2 { margin: 2px 0; font-size: 26px; letter-spacing: 2px; font-weight: 900; }
    .invoice-company-info p { margin: 2px 0; font-size: 12px; color: #555; }
    .invoice-title { text-align: center; margin: 10px 0; font-size: 24px; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; }
    td, th { border: 1px solid #333; padding: 5px 7px; font-size: 13px; vertical-align: top; }
    th { background: #eee; text-align: left; font-size: 12px; }
    .route-top-table { margin-top: 6px; }
    .route-top-table td { height: 24px; }
    .route-top-table td:nth-child(1) { width: 32%; }
    .route-top-table td:nth-child(2) { width: 36%; }
    .route-top-table td:nth-child(3) { width: 32%; }
    .route-table td { height: 66px; }
    .route-table th:nth-child(1), .route-table td:nth-child(1) { width: 25%; }
    .route-table th:nth-child(2), .route-table td:nth-child(2),
    .route-table th:nth-child(3), .route-table td:nth-child(3) { width: 12%; }
    .route-table th:nth-child(4), .route-table td:nth-child(4) { width: 51%; }
    .route-customer-name { font-weight: 700; margin-bottom: 3px; }
    .route-customer-address { font-size: 11px; line-height: 1.25; color: #333; }
    @page { size: letter; margin: 0; }
    @media print { body { margin: 0; } .route-sheet-page { margin: 0; } }
  </style>
</head>
<body>
  <div class="route-sheet-page">
    <div class="invoice-header">
      <img src="${window.location.origin}/logo.jpg" alt="Company logo" class="invoice-logo" />
      <div class="invoice-company-info">
        <h1>MAKE IT TO HAPPEN LLC</h1>
        <h2>385-601-8129</h2>
        <p>makeittohappen@gmail.com</p>
        <p>PO BOX 18670 Salt Lake City, UT 84118</p>
      </div>
    </div>
    <table class="route-top-table"><tbody><tr>
      <td><strong>Date:</strong> ${s(routeSheet.fecha || "")}</td>
      <td><strong>Driver/helper:</strong> ${s(routeSheet.conductor || "")}</td>
      <td><strong>Truck:</strong> ${s(routeSheet.camion || "")}</td>
    </tr></tbody></table>
    <h2 class="invoice-title">Route Sheet</h2>
    <table class="route-table">
      <thead><tr><th>Customer</th><th>In</th><th>Out</th><th>Description</th></tr></thead>
      <tbody>${rows.map((c) => `<tr><td>${c.cliente_nombre ? `<div class="route-customer-name">${s(c.cliente_nombre)}</div>` : ""}${c.cliente_direccion ? `<div class="route-customer-address">${s(c.cliente_direccion)}</div>` : ""}</td><td>${s(c.hora_entrada || "")}</td><td>${s(c.hora_salida || "")}</td><td>${s(c.descripcion || "")}</td></tr>`).join("")}</tbody>
    </table>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`);
    printWindow.document.close();
  };

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header-main">
          <h2 className="page-title">{t(lang, "rutas_hojas")}</h2>
          <p className="page-subtitle">{t(lang, "rutas_hojas_page_subtitle")}</p>
        </div>
        <button className="btn-primary" onClick={openNewModal}>+ {t(lang, "nueva_ruta_hoja")}</button>
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
          {filtradas.map(h => (
            <article key={h.id} className="card card--clickable" onClick={() => openPreview(h)}>
              <div className="card-main">
                <div className="badge-row">
                  <span className="badge badge-soft">RS-{h.id}</span>
                </div>
                <h3 className="card-title">{h.fecha?.slice(0, 10) || ""}</h3>
                <p className="card-text muted">
                  {h.conductor || t(lang, "sin_conductor")} {h.camion ? `| ${h.camion}` : ""}
                </p>
              </div>
              <div className="card-meta">
                <p className="card-text"><strong>{t(lang, "clientes")}:</strong> {h.clientes_count || 0}</p>
                <div className="card-actions">
                  <button className="btn-ghost" onClick={e => { e.stopPropagation(); openEditModal(h); }}>{t(lang, "editar")}</button>
                  <button className="btn-danger-ghost" onClick={e => { e.stopPropagation(); askDelete(h); }}>{t(lang, "eliminar")}</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal create/edit */}
      <Modal open={modalOpen} title={editingHoja ? t(lang, "editar_ruta_hoja_title") : t(lang, "nueva_ruta_hoja_title")} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="form-field">
              <span>{t(lang, "fecha")}</span>
              <input className="input" type="date" name="fecha" value={form.fecha} onChange={handleChange} required />
            </label>
            <label className="form-field">
              <span>{t(lang, "conductor")}</span>
              <input className="input" name="conductor" value={form.conductor} onChange={handleChange} placeholder="Driver name" />
            </label>
            <label className="form-field">
              <span>{t(lang, "camion")}</span>
              <input className="input" name="camion" value={form.camion} onChange={handleChange} placeholder="Truck #" />
            </label>
          </div>

          <div className="items-form" style={{ marginTop: "1rem" }}>
            <div className="items-form-section">
              <div className="items-form-title">{t(lang, "clientes_ruta")}</div>
              {clientesHoja.map((c, i) => (
                <div key={i} style={{ marginBottom: "0.75rem", padding: "0.5rem", border: "1px solid var(--border-subtle)", borderRadius: "12px" }}>
                  <div className="items-input-row" style={{ marginBottom: "0.4rem" }}>
                    <div className="items-input-field items-input-desc">
                      <span>{t(lang, "cliente")}</span>
                      <SearchableSelect
                        value={c.cliente_id}
                        onChange={e => handleClienteChange(i, "cliente_id", e.target.value)}
                        options={clientes.map(cl => ({ value: cl.id, label: cl.nombre }))}
                        placeholder={t(lang, "seleccionar_cliente")}
                      />
                    </div>
                    <button type="button" className="btn-remove-item" onClick={() => removeCliente(i)}>×</button>
                  </div>
                  <div className="items-input-row">
                    <div className="items-input-field">
                      <span>{t(lang, "hora_entrada")}</span>
                      <input className="input" type="time" value={c.hora_entrada} onChange={e => handleClienteChange(i, "hora_entrada", e.target.value)} style={{ width: "110px" }} />
                    </div>
                    <div className="items-input-field">
                      <span>{t(lang, "hora_salida")}</span>
                      <input className="input" type="time" value={c.hora_salida} onChange={e => handleClienteChange(i, "hora_salida", e.target.value)} style={{ width: "110px" }} />
                    </div>
                    <div className="items-input-field items-input-desc">
                      <span>{t(lang, "descripcion")}</span>
                      <input className="input" value={c.descripcion} onChange={e => handleClienteChange(i, "descripcion", e.target.value)} placeholder={t(lang, "descripcion")} />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="btn-add-item" onClick={addCliente}>+</button>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>{t(lang, "cancelar")}</button>
            <button type="submit" className="btn-primary">{t(lang, "guardar")}</button>
          </div>
        </form>
      </Modal>

      {/* Preview modal */}
      <Modal open={previewOpen} title={t(lang, "vista_previa_ruta_hoja")} onClose={() => setPreviewOpen(false)} wide>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
          <button className="btn-outline" onClick={() => previewData && printRouteSheet(previewData)}>{t(lang, "imprimir")}</button>
        </div>
        {previewData && <RouteSheetScreen data={previewData} />}
      </Modal>

      {/* Confirm delete */}
      <Modal open={confirmDeleteOpen} title={t(lang, "confirmar_eliminar")} onClose={() => setConfirmDeleteOpen(false)}>
        <p>{t(lang, "seguro_eliminar_ruta_hoja")} RS-{hojaToDelete?.id}?</p>
        <div className="form-actions">
          <button className="btn-ghost" onClick={() => setConfirmDeleteOpen(false)}>{t(lang, "cancelar")}</button>
          <button className="btn btn-danger" onClick={confirmDelete}>{t(lang, "si_eliminar")}</button>
        </div>
      </Modal>
    </div>
  );
};

export default RouteSheetPage;
