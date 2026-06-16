import React, { useEffect, useState } from "react";
import api from "../api/apiClient";
import Modal from "../components/Modal";
import SearchableSelect from "../components/SearchableSelect";
import InvoiceScreen from "./InvoicePage/InvoiceScreen";
import SearchBar from "../components/SearchBar";
import { SkeletonCard } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { useLanguage } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";
import { sanitizeHtml } from "../utils/sanitize";

const InvoicePage = () => {
  const { lang } = useLanguage();
  const toast = useToast();
  const [facturas, setFacturas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingFactura, setEditingFactura] = useState(null);
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
      const data = resFacturas.data || [];
      setFacturas(data);
      setClientes(resClientes.data || []);
      setSelectedId((current) => data.some((f) => f.id === current) ? current : data[0]?.id || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtradas = facturas.filter(f => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (f.cliente_nombre || "").toLowerCase().includes(q) ||
      (f.nota || "").toLowerCase().includes(q) ||
      (f.estado || "").toLowerCase().includes(q)
    );
  });

  const selectedFactura = facturas.find((f) => f.id === selectedId) || filtradas[0] || null;

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
        toast("Factura actualizada correctamente.", "success");
      } else {
        await api.post("/facturas", payload);
        toast("Factura creada correctamente.", "success");
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      toast("Error al guardar la factura.", "error");
    }
  };

  const askDelete = (f) => { setFacturaToDelete(f); setConfirmDeleteOpen(true); };
  const confirmDelete = async () => {
    if (!facturaToDelete) return;
    try {
      await api.delete(`/facturas/${facturaToDelete.id}`);
      toast("Factura eliminada correctamente.", "success");
      await loadData();
    } catch (err) { console.error(err); }
    finally { setConfirmDeleteOpen(false); setFacturaToDelete(null); }
  };

  const total = items.reduce((sum, i) => sum + (Number(i.precio) || 0) * (Number(i.cantidad) || 1), 0);

  const printInvoice = (invoice) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const invoiceItems = invoice.items || [];
    const invoiceTotal = invoiceItems.reduce((sum, item) => sum + (Number(item.precio) || 0) * (Number(item.cantidad) || 1), 0);
    const rows = invoiceItems.length > 0 ? invoiceItems : Array.from({ length: 5 }, () => ({}));
    const s = sanitizeHtml;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Invoice - ${s(invoice.cliente_nombre || "")}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #fff; color: #111; font-family: Arial, Helvetica, sans-serif; }
    .invoice-page { width: 8.5in; min-height: 11in; padding: 0.45in; margin: 0 auto; }
    .invoice-header { display: flex; justify-content: center; align-items: center; margin-bottom: 8px; }
    .invoice-logo { width: 560px; max-width: 100%; height: auto; display: block; object-fit: contain; }
    .invoice-title { text-align: center; margin: 10px 0; font-size: 24px; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; }
    td, th { border: 1px solid #333; padding: 5px 7px; font-size: 13px; vertical-align: top; }
    th { background: #eee; text-align: left; font-size: 12px; }
    .invoice-info-table td:first-child { width: 110px; font-weight: bold; }
    .invoice-section-label { border: 1px solid #333; border-top: 0; text-align: center; padding: 8px; font-size: 12px; }
    .invoice-job-table td { height: 40px; }
    .invoice-job-table th:nth-child(1), .invoice-job-table td:nth-child(1) { width: 85px; }
    .invoice-job-table th:nth-child(3), .invoice-job-table td:nth-child(3) { width: 55px; text-align: right; }
    .invoice-job-table th:nth-child(4), .invoice-job-table td:nth-child(4),
    .invoice-job-table th:nth-child(5), .invoice-job-table td:nth-child(5) { width: 95px; text-align: right; }
    .invoice-total-row { margin-top: 10px; text-align: right; font-size: 14px; padding: 6px 0; font-weight: 700; }
    .invoice-note { margin-top: 8px; font-size: 12px; border: 1px solid #333; padding: 6px 8px; }
    .invoice-footer-note { margin-top: 180px; font-size: 12px; color: #555; }
    .invoice-footer-note p { margin: 6px 0; }
    @page { size: letter; margin: 0; }
    @media print { body { margin: 0; } .invoice-page { margin: 0; } }
  </style>
</head>
<body>
  <div class="invoice-page">
    <div class="invoice-header">
      <img src="${window.location.origin}/logo.png" alt="Company logo" class="invoice-logo" />
    </div>
    <h2 class="invoice-title">Invoice</h2>
    <table class="invoice-info-table"><tbody>
      <tr><td><strong>Customer:</strong></td><td>${s(invoice.cliente_nombre || "")}</td></tr>
      <tr><td><strong>Address:</strong></td><td>${s(invoice.cliente_direccion || "")}</td></tr>
      <tr><td><strong>E-mail:</strong></td><td>${s(invoice.cliente_email || "")}</td></tr>
      <tr><td><strong>Phone:</strong></td><td>${s(invoice.cliente_telefono || "")}</td></tr>
    </tbody></table>
    <div class="invoice-section-label">Description of the job that was done</div>
    <table class="invoice-job-table">
      <thead><tr><th>Date</th><th>Description</th><th>Qty</th><th>Unit</th><th>Amount</th></tr></thead>
      <tbody>${rows.map((item) => {
        const qty = Number(item.cantidad) || (item.descripcion ? 1 : 0);
        const price = Number(item.precio) || 0;
        const amount = qty * price;
        return `<tr><td>${s(item.fecha || "")}</td><td>${s(item.descripcion || "")}</td><td>${qty || ""}</td><td>${item.descripcion ? `$${price.toFixed(2)}` : ""}</td><td>${item.descripcion ? `$${amount.toFixed(2)}` : ""}</td></tr>`;
      }).join("")}</tbody>
    </table>
    <div class="invoice-total-row"><strong>Total:</strong> $${invoiceTotal.toFixed(2)}</div>
    ${invoice.nota ? `<div class="invoice-note"><strong>Note:</strong> ${s(invoice.nota)}</div>` : ""}
    <div class="invoice-footer-note">
      <p>Hour Rate $</p>
      <p>Invoice must be paid within the next 10 business days. Customers with accounts over 30 days past due are subject to termination of service. Additional fees apply.</p>
    </div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`);
    printWindow.document.close();
  };

  return (
    <div className="page page--proposal mx-auto w-full max-w-[1380px]">
      <header className="page-header mb-6 flex items-center justify-between gap-4 rounded-3xl border border-[var(--record-border)] bg-[var(--bg-panel)] px-5 py-5 shadow-[var(--shadow-soft)] backdrop-blur">
        <div className="page-header-main flex flex-col gap-1">
          <h2 className="page-title text-3xl font-bold tracking-[-0.035em] text-[var(--text-main)]">{t(lang, "facturas")}</h2>
          <p className="page-subtitle text-sm text-[var(--text-muted)]">{t(lang, "facturas_page_subtitle")}</p>
        </div>
        <div className="page-header-actions flex flex-wrap items-center justify-end gap-2">
          {selectedFactura && (
            <>
              <button className="btn-ghost" onClick={() => openEditModal(selectedFactura)}>
                {t(lang, "editar")}
              </button>
              <button className="btn-danger-ghost" onClick={() => askDelete(selectedFactura)}>
                {t(lang, "eliminar")}
              </button>
              <button className="btn-outline" onClick={() => selectedFactura && printInvoice(selectedFactura)}>
                {t(lang, "imprimir")}
              </button>
            </>
          )}
          <button className="btn-primary" onClick={openNewModal}>
            + {t(lang, "nueva_factura")}
          </button>
        </div>
      </header>

      <div className="proposal-layout">
        <aside className="proposal-selector">
          <div className="proposal-selector-header">
            <SearchBar value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t(lang, "busqueda")} />
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filtradas.length === 0 ? (
            <p className="muted">{t(lang, "sin_resultados")}</p>
          ) : (
            <div className="proposal-selector-list">
              {filtradas.map(f => (
                <button
                  key={f.id}
                  className={"proposal-selector-card" + (selectedFactura?.id === f.id ? " proposal-selector-card--active" : "")}
                  onClick={() => setSelectedId(f.id)}
                >
                  <span className="proposal-selector-name">INV-{f.id} — {f.cliente_nombre || t(lang, "cliente_sin_nombre")}</span>
                  <span className="proposal-selector-meta">{f.fecha?.slice(0, 10)}</span>
                  <span className="proposal-selector-meta">${(f.items || []).reduce((s, i) => s + (Number(i.precio) || 0) * (Number(i.cantidad) || 1), 0).toFixed(2)}</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="proposal-preview-panel">
          {selectedFactura ? (
            <InvoiceScreen data={selectedFactura} />
          ) : (
            <div className="card flex justify-between gap-5 rounded-xl border border-[var(--record-border)] bg-[var(--bg-card)] p-5 shadow-[var(--record-shadow)]">
              <p className="muted">{t(lang, "sin_resultados")}</p>
            </div>
          )}
        </section>
      </div>

      {/* Modal create/edit */}
      <Modal open={modalOpen} title={editingFactura ? t(lang, "editar_factura_title") : t(lang, "nueva_factura_title")} onClose={() => setModalOpen(false)} wide>
        <form onSubmit={handleSubmit}>
          <div className="form-grid grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    <input className="input input-date" type="date" value={item.fecha} onChange={e => handleItemChange(i, "fecha", e.target.value)} />
                  </div>
                  <div className="items-input-field items-input-desc">
                    <span>{t(lang, "descripcion")}</span>
                    <input className="input" value={item.descripcion} onChange={e => handleItemChange(i, "descripcion", e.target.value)} placeholder={t(lang, "descripcion_trabajo")} />
                  </div>
                  <div className="items-input-field">
                    <span>{t(lang, "cantidad")}</span>
                    <input className="input input-qty" type="number" min="1" value={item.cantidad} onChange={e => handleItemChange(i, "cantidad", e.target.value)} />
                  </div>
                  <div className="items-input-field">
                    <span>{t(lang, "precio_unit")}</span>
                    <input className="input input-price" type="number" step="0.01" value={item.precio} onChange={e => handleItemChange(i, "precio", e.target.value)} />
                  </div>
                  <button type="button" className="btn-remove-item" onClick={() => removeItem(i)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18 M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button type="button" className="btn-add-item" onClick={addItem} style={{ marginTop: "0.5rem" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14 M5 12h14" />
                </svg>
              </button>
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

      {/* Confirm delete */}
      <Modal open={confirmDeleteOpen} title={t(lang, "confirmar_eliminar")} onClose={() => setConfirmDeleteOpen(false)}>
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--danger-soft)]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[rgb(var(--destructive))]">
              <path d="M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6" />
            </svg>
          </div>
          <p className="font-semibold text-[var(--text-main)]">{t(lang, "seguro_eliminar_factura")} INV-{facturaToDelete?.id}?</p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-ghost" onClick={() => setConfirmDeleteOpen(false)}>{t(lang, "cancelar")}</button>
          <button className="btn btn-danger" onClick={confirmDelete}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            {t(lang, "si_eliminar")}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default InvoicePage;
