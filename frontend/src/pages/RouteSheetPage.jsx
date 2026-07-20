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

const RouteSheetPrintPreview = ({ data, lang }) => {
  const clientes = data.clientes || [];
  const rows = clientes.length > 0
    ? [...clientes, ...Array.from({ length: Math.max(0, 8 - clientes.length) }, () => ({}))]
    : Array.from({ length: 8 }, () => ({}));
  const trs = (k) => t(lang, k);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#111", maxWidth: "100%", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <img src="/logo.png" alt="Company logo" style={{ width: "560px", maxWidth: "100%", height: "auto", display: "block", margin: "0 auto" }} />
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "6px" }}>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #333", padding: "5px 7px", fontSize: "13px", verticalAlign: "top", width: "32%", color: "#111" }}><strong>{trs("print_routesheet_date")}</strong> {data.fecha || ""}</td>
            <td style={{ border: "1px solid #333", padding: "5px 7px", fontSize: "13px", verticalAlign: "top", width: "36%", color: "#111" }}><strong>{trs("print_routesheet_driver")}</strong> {data.conductor || ""}</td>
            <td style={{ border: "1px solid #333", padding: "5px 7px", fontSize: "13px", verticalAlign: "top", width: "32%", color: "#111" }}><strong>{trs("print_routesheet_truck")}</strong> {data.camion || ""}</td>
          </tr>
        </tbody>
      </table>
      <h2 style={{ textAlign: "center", margin: "10px 0", fontSize: "24px", fontWeight: 500 }}>{trs("print_routesheet_title")}</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #333", padding: "5px 7px", fontSize: "12px", background: "#eee", textAlign: "left", width: "25%", color: "#111" }}>{trs("print_routesheet_customer")}</th>
            <th style={{ border: "1px solid #333", padding: "5px 7px", fontSize: "12px", background: "#eee", textAlign: "left", width: "12%", color: "#111" }}>{trs("print_routesheet_in")}</th>
            <th style={{ border: "1px solid #333", padding: "5px 7px", fontSize: "12px", background: "#eee", textAlign: "left", width: "12%", color: "#111" }}>{trs("print_routesheet_out")}</th>
            <th style={{ border: "1px solid #333", padding: "5px 7px", fontSize: "12px", background: "#eee", textAlign: "left", width: "51%", color: "#111" }}>{trs("print_routesheet_desc")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c, idx) => (
            <tr key={idx}>
              <td style={{ border: "1px solid #333", padding: "5px 7px", fontSize: "13px", verticalAlign: "top", height: "66px", color: "#111" }}>
                {c.cliente_nombre ? <div style={{ fontWeight: 700, marginBottom: "3px", color: "#111" }}>{c.cliente_nombre}</div> : null}
                {c.cliente_direccion ? <div style={{ fontSize: "11px", lineHeight: 1.25, color: "#333" }}>{c.cliente_direccion}</div> : null}
              </td>
              <td style={{ border: "1px solid #333", padding: "5px 7px", fontSize: "13px", verticalAlign: "top", color: "#111" }}>{c.hora_entrada || ""}</td>
              <td style={{ border: "1px solid #333", padding: "5px 7px", fontSize: "13px", verticalAlign: "top", color: "#111" }}>{c.hora_salida || ""}</td>
              <td style={{ border: "1px solid #333", padding: "5px 7px", fontSize: "13px", verticalAlign: "top", color: "#111" }}>{c.descripcion || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const RouteSheetPage = () => {
  const { lang } = useLanguage();
  const toast = useToast();
  const [hojas, setHojas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery);
  const LIMIT = 20;
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [debouncedQuery]);
  const [selectedId, setSelectedId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingHoja, setEditingHoja] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
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
      const data = resHojas.data || [];
      setHojas(data);
      setClientes(resClientes.data || []);
      setSelectedId((current) => data.some((h) => h.id === current) ? current : data[0]?.id || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch full detail when selectedId changes
  useEffect(() => {
    if (!selectedId) { setPreviewData(null); return; }
    let cancelled = false;
    setPreviewLoading(true);
    api.get(`/rutas-hojas/${selectedId}`)
      .then((res) => { if (!cancelled) setPreviewData(res.data); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setPreviewLoading(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  const filtradas = hojas.filter(h => {
    if (!debouncedQuery) return true;
    const q = debouncedQuery.toLowerCase();
    return (
      (h.conductor || "").toLowerCase().includes(q) ||
      (h.camion || "").toLowerCase().includes(q) ||
      (h.fecha || "").includes(q)
    );
  });

  const totalPages = Math.ceil(filtradas.length / LIMIT);
  const paginated = filtradas.slice((page - 1) * LIMIT, page * LIMIT);

  const selectedHoja = hojas.find((h) => h.id === selectedId) || filtradas[0] || null;

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
        toast(t(lang, "ruta_actualizada"), "success");
      } else {
        await api.post("/rutas-hojas", payload);
        toast(t(lang, "ruta_creada"), "success");
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      toast(t(lang, "error_guardar_ruta"), "error");
    }
  };

  const askDelete = (h) => { setHojaToDelete(h); setConfirmDeleteOpen(true); };
  const confirmDelete = async () => {
    if (!hojaToDelete) return;
    try {
      await api.delete(`/rutas-hojas/${hojaToDelete.id}`);
      toast(t(lang, "ruta_eliminada"), "success");
      await loadData();
    } catch (err) { console.error(err); }
    finally { setConfirmDeleteOpen(false); setHojaToDelete(null); }
  };

  const printRouteSheet = (routeSheet) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const s = sanitizeHtml;
    const trs = (k) => t(lang, k);
    const rows = routeSheet.clientes?.length > 0
      ? [...routeSheet.clientes, ...Array.from({ length: Math.max(0, 8 - routeSheet.clientes.length) }, () => ({}))]
      : Array.from({ length: 8 }, () => ({}));

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${trs("print_routesheet_title")} - ${s(routeSheet.fecha || "")}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #fff; color: #111; font-family: Arial, Helvetica, sans-serif; }
    .route-sheet-page { width: 8.5in; min-height: 11in; padding: 0.45in; margin: 0 auto; }
    .invoice-header { display: flex; justify-content: center; align-items: center; margin-bottom: 8px; }
    .invoice-logo { width: 560px; max-width: 100%; height: auto; display: block; object-fit: contain; }
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
      <img src="${window.location.origin}/logo.png" alt="Company logo" class="invoice-logo" />
    </div>
    <table class="route-top-table"><tbody><tr>
      <td><strong>${trs("print_routesheet_date")}</strong> ${s(routeSheet.fecha || "")}</td>
      <td><strong>${trs("print_routesheet_driver")}</strong> ${s(routeSheet.conductor || "")}</td>
      <td><strong>${trs("print_routesheet_truck")}</strong> ${s(routeSheet.camion || "")}</td>
    </tr></tbody></table>
    <h2 class="invoice-title">${trs("print_routesheet_title")}</h2>
    <table class="route-table">
      <thead><tr><th>${trs("print_routesheet_customer")}</th><th>${trs("print_routesheet_in")}</th><th>${trs("print_routesheet_out")}</th><th>${trs("print_routesheet_desc")}</th></tr></thead>
      <tbody>${rows.map((c) => `<tr><td>${c.cliente_nombre ? `<div class="route-customer-name">${s(c.cliente_nombre)}</div>` : ""}${c.cliente_direccion ? `<div class="route-customer-address">${s(c.cliente_direccion)}</div>` : ""}</td><td>${s(c.hora_entrada || "")}</td><td>${s(c.hora_salida || "")}</td><td>${s(c.descripcion || "")}</td></tr>`).join("")}</tbody>
    </table>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`);
    printWindow.document.close();
  };

  const exportRouteSheetPDF = async (routeSheet) => {
    const el = document.querySelector(".proposal-page");
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "letter");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      const name = (routeSheet.fecha || "hoja_ruta").replace(/[^a-zA-Z0-9]/g, "_");
      pdf.save(`${t(lang, "rutas_hojas").replace(/[^a-zA-Z0-9]/g, "_")}_${name}.pdf`);
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
          <h2 className="page-title text-3xl font-bold tracking-[-0.035em] text-[var(--text-main)]">{t(lang, "rutas_hojas")}</h2>
          <p className="page-subtitle text-sm text-[var(--text-muted)]">{t(lang, "rutas_hojas_page_subtitle")}</p>
        </div>
        <div className="page-header-actions flex flex-wrap items-center justify-end gap-2">
          {selectedHoja && (
            <>
              <button className="btn-action btn-action--edit" onClick={() => openEditModal(selectedHoja)}>
                <svg className="btn-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                {t(lang, "editar")}
              </button>
              <button className="btn-action btn-action--delete" onClick={() => askDelete(selectedHoja)}>
                <svg className="btn-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                {t(lang, "eliminar")}
              </button>
            </>
          )}
          <button className="btn-primary" onClick={openNewModal}>
            + {t(lang, "nueva_ruta_hoja")}
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
              {paginated.map(h => (
                <button
                  key={h.id}
                  className={"proposal-selector-card" + (selectedHoja?.id === h.id ? " proposal-selector-card--active" : "")}
                  onClick={() => setSelectedId(h.id)}
                >
                  <span className="proposal-selector-name">RS-{h.id} — {h.fecha?.slice(0, 10) || ""}</span>
                  <span className="proposal-selector-meta">{h.conductor || t(lang, "sin_conductor")}</span>
                  <span className="proposal-selector-meta">{h.clientes_count || 0} {t(lang, "clientes")}</span>
                </button>
              ))}
            </div>
          )}
          {filtradas.length > 0 && (
            <Pagination page={page} totalPages={totalPages} total={filtradas.length} limit={LIMIT} onPageChange={setPage} />
          )}
        </aside>

        <section className="proposal-preview-panel">
          {previewLoading ? (
            <div className="flex flex-col gap-3">
              {[1,2].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : previewData ? (
            <div className="proposal-page-wrapper">
              <div className="proposal-toolbar proposal-toolbar--end">
                <button className="btn-primary" onClick={() => printRouteSheet(previewData)}>
                  {t(lang, "imprimir")}
                </button>
                <button className="btn-ghost" onClick={() => exportRouteSheetPDF(previewData)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 inline-block">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  {t(lang, "exportar")}
                </button>
              </div>
              <div className="proposal-page">
                <RouteSheetPrintPreview data={previewData} lang={lang} />
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
      <Modal open={modalOpen} title={editingHoja ? t(lang, "editar_ruta_hoja_title") : t(lang, "nueva_ruta_hoja_title")} onClose={() => setModalOpen(false)} wide>
        <form onSubmit={handleSubmit}>
          <div className="form-grid grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="form-field">
              <span>{t(lang, "fecha")}</span>
              <input className="input" type="date" name="fecha" value={form.fecha} onChange={handleChange} required />
            </label>
            <label className="form-field">
              <span>{t(lang, "conductor")}</span>
              <input className="input" name="conductor" value={form.conductor} onChange={handleChange} placeholder={t(lang, "conductor")} />
            </label>
            <label className="form-field">
              <span>{t(lang, "camion")}</span>
              <input className="input" name="camion" value={form.camion} onChange={handleChange} placeholder={t(lang, "camion")} />
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
                    <button type="button" className="btn-remove-item" onClick={() => removeCliente(i)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18 M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="items-input-row">
                    <div className="items-input-field">
                      <span>{t(lang, "hora_entrada")}</span>
                      <input className="input input-time" type="time" value={c.hora_entrada} onChange={e => handleClienteChange(i, "hora_entrada", e.target.value)} />
                    </div>
                    <div className="items-input-field">
                      <span>{t(lang, "hora_salida")}</span>
                      <input className="input input-time" type="time" value={c.hora_salida} onChange={e => handleClienteChange(i, "hora_salida", e.target.value)} />
                    </div>
                    <div className="items-input-field items-input-desc">
                      <span>{t(lang, "descripcion")}</span>
                      <input className="input" value={c.descripcion} onChange={e => handleClienteChange(i, "descripcion", e.target.value)} placeholder={t(lang, "descripcion")} />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="btn-add-item" onClick={addCliente}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14 M5 12h14" /></svg>
              </button>
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
          <p className="font-semibold text-[var(--text-main)]">{t(lang, "seguro_eliminar_ruta_hoja")} RS-{hojaToDelete?.id}?</p>
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

export default RouteSheetPage;
