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
import { useDebounce } from "../hooks/useDebounce";
import { sanitizeHtml } from "../utils/sanitize";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./ProposalsPage/ProposalPreview.css";

const InvoicePrintPreview = ({ invoice, lang }) => {
  const te = (k) => t(lang, k);
  const invoiceItems = invoice.items || [];
  const invoiceTotal = invoiceItems.reduce((sum, item) => sum + (Number(item.precio) || 0) * (Number(item.cantidad) || 1), 0);
  const amount = invoiceTotal.toFixed(2);
  const effectiveDate = (invoice.fecha || "").slice(0, 10);
  const customerName = invoice.cliente_nombre || te("cliente_sin_nombre");
  const jobAddress = invoice.cliente_direccion || te("sin_direccion");
  const phone = invoice.cliente_telefono || "";
  const email = invoice.cliente_email || "";
  const description = invoice.nota || te("sin_descripcion");
  const invoiceNum = invoice.numero || `INV-${invoice.id}`;

  return (
    <>
      <header className="proposal-header">
        <img src="/logo.png" alt="Company Logo" className="proposal-logo" />
      </header>
      <h2 className="proposal-title">{te("print_invoice_title")}</h2>
      <table className="proposal-info-table">
        <tbody>
          <tr><td><strong>{te("print_invoice_number")}:</strong> {invoiceNum}</td></tr>
          <tr><td><strong>{te("print_invoice_customer")}:</strong> {customerName}</td></tr>
          <tr><td><strong>{te("print_invoice_address")}:</strong> {jobAddress}</td></tr>
          <tr><td><strong>{te("print_invoice_email")}:</strong> {email}</td></tr>
          <tr><td><strong>{te("print_invoice_phone")}:</strong> {phone}</td></tr>
          <tr><td><strong>{te("proposals_date")}:</strong> {effectiveDate}</td></tr>
        </tbody>
      </table>
      <div className="proposal-body-box">
        <div className="proposal-description-title">{te("print_invoice_section_label")}</div>
        <section className="proposal-description">
          <p>{description}</p>
        </section>
        <footer className="proposal-footer">
          <div><strong>{te("proposals_amount")}:</strong> ${amount}</div>
          <div><strong>{te("proposals_date")}:</strong> {effectiveDate}</div>
        </footer>
      </div>
    </>
  );
};

const InvoicePage = () => {
  const { lang } = useLanguage();
  const toast = useToast();
  const [facturas, setFacturas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery);
  const [filterEstado, setFilterEstado] = useState("todos");
  const LIMIT = 20;
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [debouncedQuery, filterEstado]);
  const [selectedId, setSelectedId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingFactura, setEditingFactura] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [facturaToDelete, setFacturaToDelete] = useState(null);

  const [form, setForm] = useState({
    cliente_id: "",
    fecha: new Date().toISOString().slice(0, 10),
    monto: "",
    estado: "pendiente",
    descripcion_trabajo: "",
    numero: "",
  });

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
    if (filterEstado !== "todos" && f.estado !== filterEstado) return false;
    if (!debouncedQuery) return true;
    const q = debouncedQuery.toLowerCase();
    return (
      (f.cliente_nombre || "").toLowerCase().includes(q) ||
      (f.nota || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtradas.length / LIMIT);
  const paginated = filtradas.slice((page - 1) * LIMIT, page * LIMIT);

  const selectedFactura = filtradas.find((f) => f.id === selectedId) || filtradas[0] || null;

  const openNewModal = () => {
    setEditingFactura(null);
    setForm({ cliente_id: "", fecha: new Date().toISOString().slice(0, 10), monto: "", estado: "pendiente", descripcion_trabajo: "", numero: "" });
    setModalOpen(true);
  };

  const openEditModal = (f) => {
    const totalFromItems = f.items?.reduce((s, i) => s + (Number(i.precio) || 0) * (Number(i.cantidad) || 1), 0) || 0;
    setEditingFactura(f);
    setForm({
      cliente_id: f.cliente_id || "",
      fecha: (f.fecha || "").slice(0, 10),
      monto: String(totalFromItems),
      estado: f.estado || "pendiente",
      descripcion_trabajo: f.nota || "",
      numero: f.numero || "",
    });
    setModalOpen(true);
  };

  const selectedClient = clientes.find(c => String(c.id) === String(form.cliente_id));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleClientChange = (e) => {
    setForm(f => ({ ...f, cliente_id: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      cliente_id: form.cliente_id,
      fecha: form.fecha,
      estado: form.estado,
      nota: form.descripcion_trabajo,
      numero: form.numero || null,
      items: [{
        fecha: form.fecha,
        descripcion: form.descripcion_trabajo,
        cantidad: 1,
        precio: Number(form.monto) || 0,
      }],
    };
    try {
      if (editingFactura) {
        await api.put(`/facturas/${editingFactura.id}`, payload);
        toast(t(lang, "factura_actualizada"), "success");
      } else {
        await api.post("/facturas", payload);
        toast(t(lang, "factura_creada"), "success");
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      toast(t(lang, "error_guardar_factura"), "error");
    }
  };

  const askDelete = (f) => { setFacturaToDelete(f); setConfirmDeleteOpen(true); };
  const confirmDelete = async () => {
    if (!facturaToDelete) return;
    try {
      await api.delete(`/facturas/${facturaToDelete.id}`);
      toast(t(lang, "factura_eliminada"), "success");
      await loadData();
    } catch (err) { console.error(err); }
    finally { setConfirmDeleteOpen(false); setFacturaToDelete(null); }
  };

  const printInvoice = (invoice) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const s = sanitizeHtml;
    const te = (k) => t(lang, k);
    const invoiceItems = invoice.items || [];
    const invoiceTotal = invoiceItems.reduce((sum, item) => sum + (Number(item.precio) || 0) * (Number(item.cantidad) || 1), 0);
    const amount = invoiceTotal.toFixed(2);
    const effectiveDate = (invoice.fecha || "").slice(0, 10);
    const customerName = invoice.cliente_nombre || te("cliente_sin_nombre");
    const jobAddress = invoice.cliente_direccion || te("sin_direccion");
    const phone = invoice.cliente_telefono || "";
    const email = invoice.cliente_email || "";
    const description = invoice.nota || te("sin_descripcion");
  const invoiceNum = invoice.numero || `INV-${invoice.id}`;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${te("print_invoice_title")} - ${s(customerName)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    .invoice-page {
      width: 8.5in; min-height: 11in; background: #ffffff;
      padding: 0.5in 0.7in; margin: 0 auto;
      font-family: Arial, Helvetica, sans-serif; color: #111;
    }
    .invoice-header { display: flex; align-items: center; justify-content: center; margin-bottom: 15px; }
    .invoice-logo { width: 560px; max-width: 100%; height: auto; display: block; object-fit: contain; }
    .invoice-title { text-align: center; font-size: 26px; margin: 10px 0; font-weight: 500; }
    .invoice-info-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .invoice-info-table td { border: 1px solid #333; padding: 4px 8px; }
    .invoice-info-table strong { font-weight: bold; }
    .invoice-body-box { border: 0; }
    .invoice-description-title { border: 1px solid #333; border-bottom: 0; padding: 5px 8px; text-align: center; font-size: 12px; }
    .invoice-description { border: 1px solid #333; min-height: 450px; padding: 38px 8px 20px; text-align: left; }
    .invoice-description p { white-space: pre-line; font-size: 12px; line-height: 1.8; text-align: justify; overflow-wrap: anywhere; }
    .invoice-footer {
      display: flex; justify-content: space-between; font-size: 14px;
      padding: 8px; break-inside: avoid; page-break-inside: avoid;
      border: 1px solid #333; border-top: 0;
    }
    @media print { body { margin: 0; } .invoice-page { min-height: auto; padding: 0.4in 0.5in; } .invoice-description { min-height: auto; } }
    @page { size: letter; margin: 0; }
  </style>
</head>
<body>
  <div class="invoice-page">
    <header class="invoice-header">
      <img src="${window.location.origin}/logo.png" alt="Logo" class="invoice-logo" />
    </header>
    <h2 class="invoice-title">${s(te("print_invoice_title"))}</h2>
    <table class="invoice-info-table">
      <tbody>
        <tr><td><strong>${s(te("print_invoice_number"))}:</strong> ${s(invoiceNum)}</td></tr>
        <tr><td><strong>${s(te("print_invoice_customer"))}:</strong> ${s(customerName)}</td></tr>
        <tr><td><strong>${s(te("print_invoice_address"))}:</strong> ${s(jobAddress)}</td></tr>
        <tr><td><strong>${s(te("print_invoice_email"))}:</strong> ${s(email)}</td></tr>
        <tr><td><strong>${s(te("print_invoice_phone"))}:</strong> ${s(phone)}</td></tr>
        <tr><td><strong>${s(te("proposals_date"))}:</strong> ${s(effectiveDate)}</td></tr>
      </tbody>
    </table>
    <div class="invoice-body-box">
      <div class="invoice-description-title">${s(te("print_invoice_section_label"))}</div>
      <section class="invoice-description">
        <p>${s(description)}</p>
      </section>
      <footer class="invoice-footer">
        <div><strong>${s(te("proposals_amount"))}:</strong> $${s(amount)}</div>
        <div><strong>${s(te("proposals_date"))}:</strong> ${s(effectiveDate)}</div>
      </footer>
    </div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`);
    printWindow.document.close();
  };

  const exportInvoicePDF = async (invoice) => {
    const el = document.querySelector(".proposal-page");
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "letter");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      const name = (invoice.cliente_nombre || "factura").replace(/[^a-zA-Z0-9]/g, "_");
      pdf.save(`${t(lang, "facturas").replace(/[^a-zA-Z0-9]/g, "_")}_${name}.pdf`);
      toast(t(lang, "pdf_exportado"), "success");
    } catch (err) {
      console.error("Error generando PDF", err);
      toast(t(lang, "error_pdf"), "error");
    }
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
              <button className="btn-action btn-action--edit" onClick={() => openEditModal(selectedFactura)}>
                <svg className="btn-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                {t(lang, "editar")}
              </button>
              <button className="btn-action btn-action--delete" onClick={() => askDelete(selectedFactura)}>
                <svg className="btn-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                {t(lang, "eliminar")}
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
            <div className="pill-group" style={{ marginTop: "0.5rem" }}>
              {[
                { id: "todos", label: t(lang, "todos") },
                { id: "pendiente", label: t(lang, "pendiente") },
                { id: "pagado", label: t(lang, "pagado") },
                { id: "cancelado", label: t(lang, "anulado") },
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
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filtradas.length === 0 ? (
            <p className="muted">{t(lang, "sin_resultados")}</p>
          ) : (
            <div className="proposal-selector-list">
              {paginated.map(f => (
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
          {filtradas.length > 0 && (
            <Pagination page={page} totalPages={totalPages} total={filtradas.length} limit={LIMIT} onPageChange={setPage} />
          )}
        </aside>

        <section className="proposal-preview-panel">
          {selectedFactura ? (
            <div className="proposal-page-wrapper">
              <div className="proposal-toolbar proposal-toolbar--end">
                <button className="btn-primary" onClick={() => printInvoice(selectedFactura)}>
                  {t(lang, "imprimir")}
                </button>
                <button className="btn-ghost" onClick={() => exportInvoicePDF(selectedFactura)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 inline-block">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  {t(lang, "exportar")}
                </button>
              </div>
              <div className="proposal-page">
                <InvoicePrintPreview invoice={selectedFactura} lang={lang} />
              </div>
            </div>
          ) : (
            <div className="card flex justify-between gap-5 rounded-xl border border-[var(--record-border)] bg-[var(--bg-card)] p-5 shadow-[var(--record-shadow)]">
              <p className="muted">{t(lang, "sin_resultados")}</p>
            </div>
          )}
        </section>
      </div>

      {/* Modal create/edit */}
      <Modal open={modalOpen} title={editingFactura ? t(lang, "editar_factura_title") : t(lang, "nueva_factura_title")} onClose={() => setModalOpen(false)} wide>
        <form className="items-form flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="items-form-section">
            <h3 className="items-form-title">{t(lang, "print_invoice_title")}</h3>
            <div className="items-form-grid">
              <label className="form-field">
                <span>{t(lang, "invoice_number_label")}</span>
                <input className="input" name="numero" value={form.numero} onChange={handleChange} placeholder={t(lang, "invoice_number_placeholder")} />
              </label>
              <label className="form-field">
                <span>{t(lang, "cliente")}</span>
                <SearchableSelect
                  value={form.cliente_id}
                  onChange={handleClientChange}
                  options={clientes.map(c => ({ value: c.id, label: c.nombre }))}
                  placeholder={t(lang, "seleccionar_cliente")}
                />
              </label>
              <label className="form-field">
                <span>{t(lang, "direccion")}</span>
                <input className="input" value={selectedClient?.direccion || ""} readOnly />
              </label>
              <label className="form-field">
                <span>{t(lang, "email")}</span>
                <input className="input" value={selectedClient?.email || ""} readOnly />
              </label>
              <label className="form-field">
                <span>{t(lang, "telefono")}</span>
                <input className="input" value={selectedClient?.telefono || ""} readOnly />
              </label>
            </div>
          </div>

          <div className="items-form-section">
            <h3 className="items-form-title">{t(lang, "descripcion_trabajo")}</h3>
            <div className="items-form-grid">
              <label className="form-field form-field--full">
                <textarea
                  className="input"
                  name="descripcion_trabajo"
                  value={form.descripcion_trabajo}
                  onChange={handleChange}
                  rows={6}
                  placeholder={t(lang, "descripcion_trabajo_placeholder")}
                />
              </label>
            </div>
          </div>

          <div className="items-form-footer">
            <label className="form-field">
              <span>{t(lang, "fecha")}</span>
              <input className="input" type="date" name="fecha" value={form.fecha} onChange={handleChange} required />
            </label>
            <label className="form-field">
              <span>{t(lang, "monto")}</span>
              <input className="input" type="number" step="0.01" min="0" name="monto" value={form.monto} onChange={handleChange} placeholder="0.00" required />
            </label>
            <label className="form-field">
              <span>{t(lang, "estado")}</span>
              <select className="input" name="estado" value={form.estado} onChange={handleChange}>
                <option value="pendiente">{t(lang, "pendiente")}</option>
                <option value="pagado">{t(lang, "pagado")}</option>
                <option value="cancelado">{t(lang, "anulado")}</option>
              </select>
            </label>
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
