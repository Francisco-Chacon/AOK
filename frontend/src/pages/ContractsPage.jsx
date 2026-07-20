import React, { useEffect, useState } from "react";
import api from "../api/apiClient";
import Modal from "../components/Modal";
import SearchableSelect from "../components/SearchableSelect";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import { SkeletonCard } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import { useToast } from "../components/Toast";
import { useLanguage } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";
import { validateDates } from "../utils/validate";
import { useDebounce } from "../hooks/useDebounce";
import { sanitizeHtml } from "../utils/sanitize";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./ProposalsPage/ProposalPreview.css";

const ContractPrintPreview = ({ contract, lang }) => {
  const te = (k) => t(lang, k);
  const customerName = contract.cliente_nombre || te("cliente_sin_nombre");
  const jobAddress = contract.cliente_direccion || te("sin_direccion");
  const phone = contract.cliente_telefono || "";
  const email = contract.cliente_email || "";
  const startDate = (contract.fecha_inicio || "").slice(0, 10);
  const endDate = (contract.fecha_fin || "").slice(0, 10);
  const description = contract.descripcion || "";

  return (
    <>
      <header className="proposal-header">
        <img src="/logo.png" alt="Company Logo" className="proposal-logo" />
      </header>
      <h2 className="proposal-title">{te("contract_title")}</h2>
      <table className="proposal-info-table">
        <tbody>
          <tr><td><strong>{te("print_invoice_customer")}:</strong> {customerName}</td></tr>
          <tr><td><strong>{te("print_invoice_address")}:</strong> {jobAddress}</td></tr>
          <tr><td><strong>{te("print_invoice_email")}:</strong> {email}</td></tr>
          <tr><td><strong>{te("print_invoice_phone")}:</strong> {phone}</td></tr>
          <tr><td><strong>{te("contract_start_date")}:</strong> {startDate}</td></tr>
          <tr><td><strong>{te("contract_end_date")}:</strong> {endDate}</td></tr>
        </tbody>
      </table>
      <div className="proposal-body-box">
        <div className="proposal-description-title">{te("contract_description_title")}</div>
        <section className="proposal-description">
          <p>{description}</p>
        </section>
        <footer className="proposal-footer" style={{ display: "flex", justifyContent: "space-between", padding: "20px 8px" }}>
          <div><strong>{te("print_invoice_amount")}:</strong> ${contract.monto ? Number(contract.monto).toFixed(2) : "0.00"}</div>
          <div><strong>{te("print_invoice_date")}:</strong> {(contract.fecha_inicio || "").slice(0, 10)}</div>
        </footer>
        <footer className="proposal-footer" style={{ display: "flex", justifyContent: "space-between", padding: "8px 8px 20px", borderTop: "none" }}>
          <div><strong>{te("contract_customer_signature")}:</strong> _________________________</div>
          <div><strong>{te("contract_contractor_signature")}:</strong> _________________________</div>
        </footer>
      </div>
    </>
  );
};

const ContractsPage = () => {
  const { lang } = useLanguage();
  const toast = useToast();
  const [contracts, setContracts] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery);
  const LIMIT = 20;
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [debouncedQuery]);
  const [selectedId, setSelectedId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState(null);

  const [form, setForm] = useState({
    cliente_id: "",
    fecha_inicio: new Date().toISOString().slice(0, 10),
    fecha_fin: "",
    descripcion: "",
    monto: "",
  });

  const loadData = async (signal) => {
    try {
      setLoading(true);
      const [resContracts, resClientes] = await Promise.all([
        api.get("/contracts", { signal }),
        api.get("/clientes", { signal }),
      ]);
      const data = resContracts.data || [];
      setContracts(data);
      setClientes(resClientes.data || []);
      setSelectedId((current) => data.some((c) => c.id === current) ? current : data[0]?.id || null);
    } catch (err) {
      if (err?.name !== "CanceledError") console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, []);

  const filtradas = contracts.filter((c) => {
    if (!debouncedQuery) return true;
    const q = debouncedQuery.toLowerCase();
    return (
      (c.cliente_nombre || "").toLowerCase().includes(q) ||
      (c.descripcion || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtradas.length / LIMIT);
  const paginated = filtradas.slice((page - 1) * LIMIT, page * LIMIT);

  const selectedContract = filtradas.find((c) => c.id === selectedId) || filtradas[0] || null;

  const selectedClient = clientes.find((c) => String(c.id) === String(form.cliente_id));

  const openNewModal = () => {
    setEditingContract(null);
    setFormErrors({});
    setForm({ cliente_id: "", fecha_inicio: new Date().toISOString().slice(0, 10), fecha_fin: "", descripcion: "", monto: "" });
    setModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingContract(c);
    setFormErrors({});
    setForm({
      cliente_id: c.cliente_id || "",
      fecha_inicio: (c.fecha_inicio || "").slice(0, 10),
      fecha_fin: (c.fecha_fin || "").slice(0, 10),
      descripcion: c.descripcion || "",
      monto: c.monto || "",
    });
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const checkDates = (start, end) => {
    const err = validateDates(start, end, lang);
    setFormErrors((prev) => err ? { ...prev, date_range: [err] } : (() => { const { date_range, ...rest } = prev; return rest; })());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    try {
      if (editingContract) {
        await api.put(`/contracts/${editingContract.id}`, payload);
        toast(t(lang, "contrato_actualizado"), "success");
      } else {
        await api.post("/contracts", payload);
        toast(t(lang, "contrato_creado"), "success");
      }
      setFormErrors({});
      setModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      toast(t(lang, "error_guardar_contrato"), "error");
    }
  };

  const askDelete = (c) => { setContractToDelete(c); setConfirmDeleteOpen(true); };
  const confirmDelete = async () => {
    if (!contractToDelete) return;
    try {
      await api.delete(`/contracts/${contractToDelete.id}`);
      toast(t(lang, "contrato_eliminado"), "success");
      await loadData();
    } catch (err) {
      console.error(err);
      toast(t(lang, "error_eliminar_contrato"), "error");
    } finally {
      setConfirmDeleteOpen(false);
      setContractToDelete(null);
    }
  };

  const printContract = (contract) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const s = sanitizeHtml;
    const te = (k) => t(lang, k);
    const customerName = contract.cliente_nombre || te("cliente_sin_nombre");
    const jobAddress = contract.cliente_direccion || te("sin_direccion");
    const phone = contract.cliente_telefono || "";
    const email = contract.cliente_email || "";
    const startDate = (contract.fecha_inicio || "").slice(0, 10);
    const endDate = (contract.fecha_fin || "").slice(0, 10);
    const description = contract.descripcion || "";
    const amount = contract.monto ? Number(contract.monto).toFixed(2) : "0.00";

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${s(te("contract_title"))} - ${s(customerName)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    .page { width: 8.5in; min-height: 11in; background: #fff; padding: 0.5in 0.7in; margin: 0 auto; font-family: Arial, Helvetica, sans-serif; color: #111; }
    .header { display: flex; align-items: center; justify-content: center; margin-bottom: 15px; }
    .logo { width: 560px; max-width: 100%; height: auto; display: block; object-fit: contain; }
    .title { text-align: center; font-size: 26px; margin: 10px 0; font-weight: 500; }
    .info-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .info-table td { border: 1px solid #333; padding: 4px 8px; }
    .info-table strong { font-weight: bold; }
    .body-box { border: 0; }
    .desc-title { border: 1px solid #333; border-bottom: 0; padding: 5px 8px; text-align: center; font-size: 12px; }
    .desc { border: 1px solid #333; min-height: 380px; padding: 38px 8px 20px; text-align: left; }
    .desc p { white-space: pre-line; font-size: 12px; line-height: 1.8; text-align: justify; overflow-wrap: anywhere; }
    .footer { display: flex; justify-content: space-between; font-size: 14px; padding: 12px 8px; border: 1px solid #333; }
    .footer-signatures { display: flex; justify-content: space-between; font-size: 14px; padding: 8px 8px 20px; border: 1px solid #333; border-top: 0; }
    @media print { body { margin: 0; } .page { min-height: auto; padding: 0.4in 0.5in; } .desc { min-height: auto; } }
    @page { size: letter; margin: 0; }
  </style>
</head>
<body>
  <div class="page">
    <header class="header"><img src="${window.location.origin}/logo.png" alt="Logo" class="logo" /></header>
    <h2 class="title">${s(te("contract_title"))}</h2>
    <table class="info-table">
      <tbody>
        <tr><td><strong>${s(te("print_invoice_customer"))}:</strong> ${s(customerName)}</td></tr>
        <tr><td><strong>${s(te("print_invoice_address"))}:</strong> ${s(jobAddress)}</td></tr>
        <tr><td><strong>${s(te("print_invoice_email"))}:</strong> ${s(email)}</td></tr>
        <tr><td><strong>${s(te("print_invoice_phone"))}:</strong> ${s(phone)}</td></tr>
        <tr><td><strong>${s(te("contract_start_date"))}:</strong> ${s(startDate)}</td></tr>
        <tr><td><strong>${s(te("contract_end_date"))}:</strong> ${s(endDate)}</td></tr>
      </tbody>
    </table>
    <div class="body-box">
      <div class="desc-title">${s(te("contract_description_title"))}</div>
      <section class="desc"><p>${s(description)}</p></section>
      <footer class="footer">
        <div><strong>${s(te("print_invoice_amount"))}:</strong> $${s(amount)}</div>
        <div><strong>${s(te("print_invoice_date"))}:</strong> ${s(startDate)}</div>
      </footer>
      <footer class="footer-signatures">
        <div><strong>${s(te("contract_customer_signature"))}:</strong> _________________________</div>
        <div><strong>${s(te("contract_contractor_signature"))}:</strong> _________________________</div>
      </footer>
    </div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`);
    printWindow.document.close();
  };

  const exportContractPDF = async (contract) => {
    const el = document.querySelector(".proposal-page");
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "letter");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      const name = (contract.cliente_nombre || "contract").replace(/[^a-zA-Z0-9]/g, "_");
      pdf.save(`${te("contract_title")}_${name}.pdf`);
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
          <h2 className="page-title text-3xl font-bold tracking-[-0.035em] text-[var(--text-main)]">{t(lang, "contracts")}</h2>
        </div>
        <div className="page-header-actions flex flex-wrap items-center justify-end gap-2">
          {selectedContract && (
            <>
              <button className="btn-action btn-action--edit" onClick={() => openEditModal(selectedContract)}>
                <svg className="btn-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                {t(lang, "editar")}
              </button>
              <button className="btn-action btn-action--delete" onClick={() => askDelete(selectedContract)}>
                <svg className="btn-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                {t(lang, "eliminar")}
              </button>
            </>
          )}
          <button className="btn-primary" onClick={openNewModal}>
            + {t(lang, "nuevo_contract")}
          </button>
        </div>
      </header>

      <div className="proposal-layout">
        <aside className="proposal-selector">
          <div className="proposal-selector-header">
            <SearchBar value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t(lang, "busqueda")} />
          </div>
          {loading ? (
            <div className="flex flex-col gap-3">{[1,2,3].map((i) => <SkeletonCard key={i} />)}</div>
          ) : filtradas.length === 0 ? (
            <EmptyState svg="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" title={t(lang, "sin_resultados")} description="" />
          ) : (
            <div className="proposal-selector-list">
              {paginated.map((c) => (
                <button
                  key={c.id}
                  className={"proposal-selector-card" + (selectedContract?.id === c.id ? " proposal-selector-card--active" : "")}
                  onClick={() => setSelectedId(c.id)}
                >
                  <span className="proposal-selector-name">{c.cliente_nombre || t(lang, "cliente_sin_nombre")}</span>
                  <span className="proposal-selector-meta">{(c.fecha_inicio || "").slice(0, 10)}</span>
                </button>
              ))}
            </div>
          )}
          {filtradas.length > 0 && (
            <Pagination page={page} totalPages={totalPages} total={filtradas.length} limit={LIMIT} onPageChange={setPage} />
          )}
        </aside>

        <section className="proposal-preview-panel">
          {selectedContract ? (
            <div className="proposal-page-wrapper">
              <div className="proposal-toolbar proposal-toolbar--end">
                <button className="btn-primary" onClick={() => printContract(selectedContract)}>
                  {t(lang, "imprimir")}
                </button>
                <button className="btn-ghost" onClick={() => exportContractPDF(selectedContract)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 inline-block">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  {t(lang, "exportar")}
                </button>
              </div>
              <div className="proposal-page">
                <ContractPrintPreview contract={selectedContract} lang={lang} />
              </div>
            </div>
          ) : (
            <div className="card flex justify-between gap-5 rounded-xl border border-[var(--record-border)] bg-[var(--bg-card)] p-5 shadow-[var(--record-shadow)]">
              <p className="muted">{t(lang, "sin_resultados")}</p>
            </div>
          )}
        </section>
      </div>

      <Modal open={modalOpen} title={editingContract ? t(lang, "editar_contract_title") : t(lang, "nuevo_contract")} onClose={() => setModalOpen(false)} wide>
        <form className="items-form flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="items-form-section">
            <h3 className="items-form-title">{t(lang, "cliente")}</h3>
            <div className="items-form-grid">
              <label className="form-field">
                <span>{t(lang, "cliente")}</span>
                <SearchableSelect
                  value={form.cliente_id}
                  onChange={(e) => setForm((f) => ({ ...f, cliente_id: e.target.value }))}
                  options={clientes.map((c) => ({ value: c.id, label: c.nombre }))}
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
            <h3 className="items-form-title">{t(lang, "contract_description_title")}</h3>
            <div className="items-form-grid">
              <label className="form-field form-field--full">
                <textarea
                  className="input"
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  rows={6}
                  placeholder={t(lang, "descripcion_trabajo_placeholder")}
                  required
                />
              </label>
            </div>
          </div>

          {formErrors.date_range?.map((msg, i) => (<span key={i} className="field-error" style={{ marginBottom: 8 }}>{msg}</span>))}
          <div className="items-form-footer">
            <label className="form-field">
              <span>{t(lang, "contract_start_date")}</span>
              <input className="input" type="date" name="fecha_inicio" value={form.fecha_inicio} onChange={(e) => { handleChange(e); checkDates(e.target.value, form.fecha_fin); }} required />
            </label>
            <label className="form-field">
              <span>{t(lang, "contract_end_date")}</span>
              <input className="input" type="date" name="fecha_fin" value={form.fecha_fin} onChange={(e) => { handleChange(e); checkDates(form.fecha_inicio, e.target.value); }} required />
              {formErrors.date_range?.map((msg, i) => (<span key={i} className="field-error">{msg}</span>))}
            </label>
            <label className="form-field">
              <span>{t(lang, "print_invoice_amount")}</span>
              <input className="input" type="number" step="0.01" min="0" name="monto" value={form.monto} onChange={handleChange} placeholder="0.00" required />
              {formErrors.monto?.map((msg, i) => (<span key={i} className="field-error">{msg}</span>))}
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>{t(lang, "cancelar")}</button>
            <button type="submit" className="btn-primary">{t(lang, "guardar")}</button>
          </div>
        </form>
      </Modal>

      <Modal open={confirmDeleteOpen} title={t(lang, "confirmar_eliminar")} onClose={() => setConfirmDeleteOpen(false)}>
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--danger-soft)]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[rgb(var(--destructive))]">
              <path d="M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6" />
            </svg>
          </div>
          <p className="font-semibold text-[var(--text-main)]">{t(lang, "seguro_eliminar_contract")}?</p>
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

export default ContractsPage;
