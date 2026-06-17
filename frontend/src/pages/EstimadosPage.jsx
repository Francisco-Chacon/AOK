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
import { sanitizeHtml } from "../utils/sanitize";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./ProposalsPage/ProposalPreview.css";

const MONEDAS = ["USD", "EUR", "MXN", "PAB", "COP"];

const EstimadosPage = () => {
  const { lang } = useLanguage();
  const toast = useToast();
  const [estimados, setEstimados] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filterEstado, setFilterEstado] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const LIMIT = 20;
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [debouncedQuery, filterEstado]);

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

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [estimadoToDelete, setEstimadoToDelete] = useState(null);

  useEffect(() => {
    api.get("/clientes").then((res) => setClientes(res.data || [])).catch(() => {});
    api.get("/estimados").then((res) => {
      const data = res.data || [];
      setEstimados(data);
      setSelectedId((current) => data.some((e) => e.id === current) ? current : data[0]?.id || null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resClientes, resEstimados] = await Promise.all([api.get("/clientes"), api.get("/estimados")]);
      const data = resEstimados.data || [];
      setClientes(resClientes.data || []);
      setEstimados(data);
      setSelectedId((current) => data.some((e) => e.id === current) ? current : data[0]?.id || null);
    } catch (err) {
      console.error("Error cargando datos", err);
    } finally {
      setLoading(false);
    }
  };

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

  const openEditModal = (e) => {
    setEditingEstimado(e);
    setForm({
      cliente_id: e.cliente_id || "",
      direccion_trabajo: e.direccion_trabajo || "",
      fecha: (e.fecha || "").slice(0, 10),
      monto: e.monto || "",
      moneda: e.moneda || "USD",
      descripcion_trabajo: e.notas_adicionales || "",
      estado: e.estado || "borrador",
    });
    const itemsArray = getItemsFromDescripcion(e.descripcion_trabajo, e.monto, e.moneda).map((item) => ({
      ...item,
      total: item.cantidad * item.precio_unitario,
    }));
    setItems(itemsArray);
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
      toast("Completá descripción y precio unitario", "warning");
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

  const calculateSubtotal = () => items.reduce((acc, item) => acc + (item.total || 0), 0);

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal + subtotal * 0.07;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
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
      if (editingEstimado) {
        await api.put(`/estimados/${editingEstimado.id}`, payload);
        toast("Estimado actualizado correctamente.", "success");
      } else {
        await api.post("/estimados", payload);
        toast("Estimado creado correctamente.", "success");
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error guardando estimado", err);
      toast("No se pudo guardar el estimado.", "error");
    }
  };

  const askDelete = (e) => {
    setEstimadoToDelete(e);
    setConfirmDeleteOpen(true);
  };

  const cancelDelete = () => {
    setConfirmDeleteOpen(false);
    setEstimadoToDelete(null);
  };

  const confirmDelete = async () => {
    if (!estimadoToDelete) return;
    try {
      await api.delete(`/estimados/${estimadoToDelete.id}`);
      toast("Estimado eliminado correctamente.", "success");
      await loadData();
    } catch (err) {
      console.error("Error eliminando estimado", err);
      toast("No se pudo eliminar el estimado.", "error");
    } finally {
      setConfirmDeleteOpen(false);
      setEstimadoToDelete(null);
    }
  };

  const getItemsFromDescripcion = (descripcion, monto) => {
    if (!descripcion) return [];
    const lines = descripcion.split("\n").filter((line) => line.trim());
    return lines.map((line) => {
      const match = line.match(/^(\d+)x\s+(.+)\s+\(\$([\d.]+)\s+c\/u\)$/);
      if (match) {
        return {
          cantidad: parseInt(match[1]),
          descripcion: match[2],
          precio_unitario: parseFloat(match[3]),
        };
      }
      return {
        cantidad: 1,
        descripcion: line,
        precio_unitario: monto || 0,
      };
    });
  };

  const printStatement = (estimado) => {
    const items = getItemsFromDescripcion(estimado.descripcion_trabajo, estimado.monto, estimado.moneda);
    const storedTotal = Number(estimado.monto || 0);
    const itemsSubtotal = items.reduce((sum, item) => sum + (Number(item.cantidad) || 1) * (Number(item.precio_unitario) || 0), 0);
    const subtotal = itemsSubtotal || (storedTotal ? storedTotal / 1.07 : 0);
    const tax = subtotal * 0.07;
    const statementTotal = storedTotal || subtotal + tax;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const s = sanitizeHtml;
    const ivaLabel = t(lang, "impuesto_nombre") || "ITBMS (7%)";
    const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // eslint-disable-line react-hooks/purity

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${t(lang, "estimado")} - ${s(estimado.cliente_nombre) || t(lang, "cliente_sin_nombre")}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
    .header { display: flex; align-items: center; justify-content: center; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #333; }
    .logo { width: 560px; max-width: 100%; height: auto; display: block; object-fit: contain; }
    .title-section { text-align: center; margin: 30px 0; }
    .title-section h1 { font-size: 28px; font-weight: bold; }
    .client-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .client-info-left { width: 45%; }
    .client-info-right { width: 45%; text-align: right; }
    .info-label { font-size: 11px; color: #777; text-transform: uppercase; margin-bottom: 2px; }
    .info-value { font-size: 14px; font-weight: bold; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { border: 1px solid #333; padding: 10px 12px; text-align: left; background: #f5f5f5; font-size: 12px; }
    td { border: 1px solid #333; padding: 10px 12px; text-align: left; font-size: 13px; }
    .col-cantidad, .col-pu, .col-importe { text-align: right; width: 80px; }
    .totals { display: flex; justify-content: flex-end; margin-top: 20px; }
    .totals-table { width: 200px; border-collapse: collapse; }
    .totals-table td { border: none; padding: 6px 10px; text-align: right; }
    .totals-table .label { font-weight: bold; }
    .totals-table .total-row { font-size: 16px; font-weight: bold; border-top: 2px solid #333; }
    .notas { margin-top: 20px; padding: 12px; background: #f9f9f9; border-radius: 4px; }
    .notas-label { font-weight: bold; margin-bottom: 4px; font-size: 12px; }
    .notas p { font-size: 12px; margin: 0; }
    .footer-message { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; }
    .footer-message p { font-size: 12px; color: #666; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <img src="${window.location.origin}/logo.png" alt="Logo" class="logo" />
  </div>

  <div class="title-section">
    <h1>${t(lang, "estimado").toUpperCase()}</h1>
  </div>

  <div class="client-info">
    <div class="client-info-left">
      <div class="info-label">${s(t(lang, "cliente"))}</div>
      <div class="info-value">${s(estimado.cliente_nombre) || t(lang, "cliente_sin_nombre")}</div>
      <div class="info-label">${s(t(lang, "direccion"))}</div>
      <div class="info-value">${s(estimado.direccion_trabajo) || t(lang, "sin_direccion")}</div>
    </div>
    <div class="client-info-right">
      <div class="info-label">${t(lang, "numero_estimado")}</div>
      <div class="info-value">#${estimado.id || "N/A"}</div>
      <div class="info-label">${s(t(lang, "fecha"))}</div>
      <div class="info-value">${estimado.fecha?.slice(0, 10) || new Date().toISOString().slice(0, 10)}</div>
      <div class="info-label">${t(lang, "valido_hasta")}</div>
      <div class="info-value">${validUntil}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>${s(t(lang, "descripcion"))}</th>
        <th class="col-cantidad">${s(t(lang, "cantidad"))}</th>
        <th class="col-pu">${s(t(lang, "precio_unit"))}</th>
        <th class="col-importe">${s(t(lang, "total"))}</th>
      </tr>
    </thead>
    <tbody>
      ${items.length === 0 ? `<tr><td colspan="4" style="color:#999;text-align:center">${t(lang, "sin_materials")}</td></tr>` : items.map((item) => `
      <tr>
        <td>${s(item.descripcion)}</td>
        <td class="col-cantidad">${item.cantidad}</td>
        <td class="col-pu">${s(estimado.moneda)} ${Number(item.precio_unitario).toFixed(2)}</td>
        <td class="col-importe">${s(estimado.moneda)} ${Number(item.cantidad * item.precio_unitario).toFixed(2)}</td>
      </tr>`).join("")}
    </tbody>
  </table>

  <div class="totals">
    <table class="totals-table">
      <tr>
        <td class="label">${t(lang, "subtotal")}:</td>
        <td>${s(estimado.moneda)} ${subtotal.toFixed(2)}</td>
      </tr>
      <tr>
        <td class="label">${ivaLabel}:</td>
        <td>${s(estimado.moneda)} ${tax.toFixed(2)}</td>
      </tr>
      <tr class="total-row">
        <td class="label">${t(lang, "total")}:</td>
        <td>${s(estimado.moneda)} ${statementTotal.toFixed(2)}</td>
      </tr>
    </table>
  </div>

  ${estimado.notas_adicionales?.trim() ? `
  <div class="notas">
    <div class="notas-label">${t(lang, "notas_adicionales")}</div>
    <p>${s(estimado.notas_adicionales)}</p>
  </div>` : ""}

  <div class="footer-message">
    <p>${t(lang, "footer_mensaje_1")}</p>
    <p>${t(lang, "footer_mensaje_2")}</p>
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`);
    printWindow.document.close();
  };

  const exportEstimadoPDF = async (estimado) => {
    const el = document.querySelector(".proposal-page");
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "letter");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      const name = (estimado.cliente_nombre || "estimado").replace(/[^a-zA-Z0-9]/g, "_");
      pdf.save(`Estimado_${name}.pdf`);
      toast("PDF exportado correctamente.", "success");
    } catch (err) {
      console.error("Error generando PDF", err);
      toast("Error al generar el PDF.", "error");
    }
  };

  const filtrados = estimados.filter((e) => {
    if (filterEstado !== "todos" && e.estado !== filterEstado) return false;
    if (!debouncedQuery) return true;
    const q = debouncedQuery.toLowerCase();
    return (
      (e.cliente_nombre || "").toLowerCase().includes(q) ||
      (e.direccion_trabajo || "").toLowerCase().includes(q) ||
      (e.descripcion_trabajo || "").toLowerCase().includes(q) ||
      (e.estado || "").toLowerCase().includes(q) ||
      String(e.monto || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtrados.length / LIMIT);
  const paginated = filtrados.slice((page - 1) * LIMIT, page * LIMIT);

  const selectedEstimado = estimados.find((e) => e.id === selectedId) || filtrados[0] || null;

  return (
    <div className="page page--proposal mx-auto w-full max-w-[1380px]">
      <header className="page-header mb-6 flex items-center justify-between gap-4 rounded-3xl border border-[var(--record-border)] bg-[var(--bg-panel)] px-5 py-5 shadow-[var(--shadow-soft)] backdrop-blur">
        <div className="page-header-main flex flex-col gap-1">
          <h2 className="page-title text-3xl font-bold tracking-[-0.035em] text-[var(--text-main)]">{t(lang, "estimados")}</h2>
          <p className="page-subtitle text-sm text-[var(--text-muted)]">{t(lang, "estimados_page_subtitle")}</p>
        </div>
        <div className="page-header-actions flex flex-wrap items-center justify-end gap-2">
          {selectedEstimado && (
            <>
              <button className="btn-ghost" onClick={() => openEditModal(selectedEstimado)}>
                {t(lang, "editar")}
              </button>
              <button className="btn-danger-ghost" onClick={() => askDelete(selectedEstimado)}>
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
            <SearchBar value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t(lang, "busqueda")} />
            <div className="pill-group mt-3 flex flex-wrap gap-1.5">
              {["todos", "borrador", "enviado", "aceptado", "rechazado"].map((opt) => (
                <button
                  key={opt}
                  className={"pill" + (filterEstado === opt ? " pill--active" : "")}
                  onClick={() => setFilterEstado(opt)}
                >
                  {t(lang, opt)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filtrados.length === 0 ? (
            <p className="muted">{t(lang, "sin_resultados")}</p>
          ) : (
            <div className="proposal-selector-list">
              {paginated.map((e) => (
                <button
                  key={e.id}
                  className={"proposal-selector-card" + (selectedEstimado?.id === e.id ? " proposal-selector-card--active" : "")}
                  onClick={() => setSelectedId(e.id)}
                >
                  <span className="proposal-selector-name">{e.cliente_nombre || t(lang, "cliente_sin_nombre")}</span>
                  <span className="proposal-selector-meta">{e.fecha?.slice(0, 10)}</span>
                  <span className="proposal-selector-meta">{e.moneda} {Number(e.monto || 0).toFixed(2)}</span>
                </button>
              ))}
            </div>
          )}
          {filtrados.length > 0 && (
            <Pagination page={page} totalPages={totalPages} total={filtrados.length} limit={LIMIT} onPageChange={setPage} />
          )}
        </aside>

        <section className="proposal-preview-panel">
          {selectedEstimado ? (
            <div className="proposal-page-wrapper">
              <div className="proposal-toolbar proposal-toolbar--end">
                <button className="btn-primary" onClick={() => printStatement(selectedEstimado)}>
                  {t(lang, "imprimir")}
                </button>
                <button className="btn-ghost" onClick={() => exportEstimadoPDF(selectedEstimado)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 inline-block">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  {t(lang, "exportar")}
                </button>
              </div>
              <div className="proposal-page">
                <EstimadoPDF estimado={selectedEstimado} lang={lang} />
              </div>
            </div>
          ) : (
            <div className="card flex justify-between gap-5 rounded-xl border border-[var(--record-border)] bg-[var(--bg-card)] p-5 shadow-[var(--record-shadow)]">
              <p className="muted">{t(lang, "sin_resultados")}</p>
            </div>
          )}
        </section>
      </div>

      {/* Modal crear / editar */}
      <Modal
        open={modalOpen}
        title={editingEstimado ? t(lang, "editar_estimado_title") : t(lang, "nuevo_estimado_title")}
        onClose={() => setModalOpen(false)}
        wide
      >
        <form className="items-form flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="items-form-section rounded-2xl border border-[var(--record-border)] bg-[var(--bg-card)] p-4">
            <h3 className="items-form-title mb-4 text-base font-bold text-[var(--text-main)]">{t(lang, "datos_cliente")}</h3>
            <div className="items-form-grid grid grid-cols-1 gap-4 md:grid-cols-2">
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
                <span>{t(lang, "direccion_trabajo")}</span>
                <input className="input" name="direccion_trabajo" value={form.direccion_trabajo} onChange={handleChange} required />
              </label>
              <label className="form-field">
                <span>{t(lang, "fecha")}</span>
                <input className="input" type="date" name="fecha" value={form.fecha} onChange={handleChange} required />
              </label>
            </div>
          </div>

          <div className="items-form-section rounded-2xl border border-[var(--record-border)] bg-[var(--bg-card)] p-4">
            <h3 className="items-form-title mb-4 text-base font-bold text-[var(--text-main)]">{t(lang, "agregar_materials")}</h3>
            <div className="items-input-row">
              <div className="items-input-field items-input-desc">
                <span>{t(lang, "descripcion")}</span>
                <input className="input" name="descripcion" value={newItem.descripcion} onChange={handleNewItemChange} placeholder={t(lang, "ejemplo_material")} />
              </div>
              <div className="items-input-field">
                <span>{t(lang, "cantidad")}</span>
                <input className="input" type="number" name="cantidad" value={newItem.cantidad} onChange={handleNewItemChange} min="1" />
              </div>
              <div className="items-input-field">
                <span>{t(lang, "precio_unit")}</span>
                <input className="input" type="number" step="0.01" name="precio_unitario" value={newItem.precio_unitario} onChange={handleNewItemChange} placeholder="0.00" />
              </div>
              <button type="button" className="btn-add-item" onClick={addItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14 M5 12h14" /></svg>
              </button>
            </div>
          </div>

          <div className="items-form-section rounded-2xl border border-[var(--record-border)] bg-[var(--bg-card)] p-4">
            <h3 className="items-form-title mb-4 text-base font-bold text-[var(--text-main)]">{t(lang, "materials_agregados")}</h3>
            {items.length === 0 ? (
              <p className="muted">{t(lang, "sin_materials")}</p>
            ) : (
              <table className="items-table">
                <thead>
                  <tr><th>#</th><th>{t(lang, "descripcion")}</th><th>{t(lang, "cantidad")}</th><th>{t(lang, "precio_unit")}</th><th>{t(lang, "total")}</th><th></th></tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{item.descripcion}</td>
                      <td>{item.cantidad}</td>
                      <td>${Number(item.precio_unitario || 0).toFixed(2)}</td>
                      <td>${Number(item.total || (item.cantidad * item.precio_unitario) || 0).toFixed(2)}</td>
                      <td>
                        <button type="button" className="btn-remove-item" onClick={() => removeItem(index)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18 M6 6l12 12" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td colSpan={3} className="items-total-label">{t(lang, "subtotal")}</td><td className="items-total-value">${calculateSubtotal().toFixed(2)}</td><td></td></tr>
                  <tr><td colSpan={3} className="items-total-label">{t(lang, "impuesto")} (7%)</td><td className="items-total-value">${(calculateSubtotal() * 0.07).toFixed(2)}</td><td></td></tr>
                  <tr><td colSpan={3} className="items-total-label">{t(lang, "total")}</td><td className="items-total-value">${calculateTotal().toFixed(2)}</td><td></td></tr>
                </tfoot>
              </table>
            )}
          </div>

          <div className="items-form-section rounded-2xl border border-[var(--record-border)] bg-[var(--bg-card)] p-4">
            <h3 className="items-form-title mb-4 text-base font-bold text-[var(--text-main)]">{t(lang, "notas_adicionales_trabajo")}</h3>
            <div className="items-form-grid grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="form-field form-field--full">
                <span>{t(lang, "descripcion_trabajo")}</span>
                <textarea className="input" name="descripcion_trabajo" value={form.descripcion_trabajo} onChange={handleChange} rows={3} placeholder={t(lang, "descripcion_trabajo_placeholder")} />
              </label>
            </div>
          </div>

          <div className="items-form-footer">
            <div className="items-form-footer-left">
              <label className="form-field">
                <span>{t(lang, "estado")}</span>
                <select className="input" name="estado" value={form.estado} onChange={handleChange}>
                  <option value="borrador">{t(lang, "borrador")}</option>
                  <option value="enviado">{t(lang, "enviado")}</option>
                  <option value="aceptado">{t(lang, "aceptado")}</option>
                  <option value="rechazado">{t(lang, "rechazado")}</option>
                </select>
              </label>
              <label className="form-field">
                <span>{t(lang, "moneda")}</span>
                <select className="input" name="moneda" value={form.moneda} onChange={handleChange}>
                  {MONEDAS.map((m) => (<option key={m} value={m}>{m}</option>))}
                </select>
              </label>
            </div>
            <div className="items-form-footer-right">
              <div style={{ textAlign: "right" }}>
                <div className="muted" style={{ fontSize: "0.8rem" }}>{t(lang, "subtotal")}: ${calculateSubtotal().toFixed(2)} {form.moneda}</div>
                <div className="muted" style={{ fontSize: "0.8rem" }}>{t(lang, "impuesto")} (7%): ${(calculateSubtotal() * 0.07).toFixed(2)} {form.moneda}</div>
                <span className="items-grand-total">{t(lang, "total")}: ${calculateTotal().toFixed(2)} {form.moneda}</span>
              </div>
            </div>
          </div>

          <div className="form-actions flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>{t(lang, "cancelar")}</button>
            <button type="submit" className="btn-primary">{t(lang, "guardar")}</button>
          </div>
        </form>
      </Modal>

      {/* Modal confirmación eliminar */}
      <Modal open={confirmDeleteOpen} title={t(lang, "confirmar_eliminar")} onClose={cancelDelete}>
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--danger-soft)]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[rgb(var(--destructive))]">
              <path d="M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6" />
            </svg>
          </div>
          <p className="font-semibold text-[var(--text-main)]">
            {t(lang, "seguro_eliminar_estimado")}
            {estimadoToDelete?.cliente_nombre ? <span className="font-bold"> de "{estimadoToDelete.cliente_nombre}"</span> : ""}?
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn-ghost" onClick={cancelDelete}>{t(lang, "cancelar")}</button>
          <button type="button" className="btn btn-danger" onClick={confirmDelete}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            {t(lang, "si_eliminar")}
          </button>
        </div>
      </Modal>
    </div>
  );
};

/* ---------- Inline PDF preview (original StatementModal style) ---------- */
const getItems = (descripcion, monto) => {
  if (!descripcion) return [];
  const lines = descripcion.split("\n").filter((l) => l.trim());
  return lines.map((line) => {
    const match = line.match(/^(\d+)x\s+(.+)\s+\(\$([\d.]+)\s+c\/u\)$/);
    if (match) {
      return { cantidad: parseInt(match[1]), descripcion: match[2], precio_unitario: parseFloat(match[3]) };
    }
    return { cantidad: 1, descripcion: line, precio_unitario: monto || 0 };
  });
};

const EstimadoPDF = ({ estimado, lang }) => {
  const items = getItems(estimado.descripcion_trabajo, estimado.monto);
  const storedTotal = Number(estimado.monto || 0);
  const itemsSubtotal = items.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0);
  const subtotal = itemsSubtotal || (storedTotal ? storedTotal / 1.07 : 0);
  const tax = subtotal * 0.07;
  const total = storedTotal || subtotal + tax;
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const te = (k) => t(lang, k);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#333", maxWidth: "100%", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "20px", paddingBottom: "20px", borderBottom: "2px solid #333" }}>
        <img src="/logo.png" alt="Logo" style={{ width: "560px", maxWidth: "100%", height: "auto", display: "block", margin: "0 auto" }} />
      </div>

      <div style={{ textAlign: "center", margin: "30px 0" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", letterSpacing: "0.05em" }}>{te("estimado").toUpperCase()}</h1>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
        <div style={{ width: "45%" }}>
          <div style={{ fontSize: "11px", color: "#777", textTransform: "uppercase", marginBottom: "2px" }}>{te("cliente")}</div>
          <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px" }}>{estimado.cliente_nombre || te("cliente_sin_nombre")}</div>
          <div style={{ fontSize: "11px", color: "#777", textTransform: "uppercase", marginBottom: "2px" }}>{te("direccion")}</div>
          <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px" }}>{estimado.direccion_trabajo || te("sin_direccion")}</div>
        </div>
        <div style={{ width: "45%", textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "#777", textTransform: "uppercase", marginBottom: "2px" }}>{te("numero_estimado")}</div>
          <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px" }}>#{estimado.id || "N/A"}</div>
          <div style={{ fontSize: "11px", color: "#777", textTransform: "uppercase", marginBottom: "2px" }}>{te("fecha")}</div>
          <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px" }}>{estimado.fecha?.slice(0, 10) || ""}</div>
          <div style={{ fontSize: "11px", color: "#777", textTransform: "uppercase", marginBottom: "2px" }}>{te("valido_hasta")}</div>
          <div style={{ fontSize: "14px", fontWeight: "bold" }}>{validUntil}</div>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
        <thead>
          <tr style={{ background: "#f5f5f5" }}>
            <th style={{ border: "1px solid #333", padding: "10px 12px", textAlign: "left", fontSize: "12px", color: "#111" }}>{te("descripcion")}</th>
            <th style={{ border: "1px solid #333", padding: "10px 12px", textAlign: "right", fontSize: "12px", width: "80px", color: "#111" }}>{te("cantidad")}</th>
            <th style={{ border: "1px solid #333", padding: "10px 12px", textAlign: "right", fontSize: "12px", width: "80px", color: "#111" }}>{te("precio_unit")}</th>
            <th style={{ border: "1px solid #333", padding: "10px 12px", textAlign: "right", fontSize: "12px", width: "80px", color: "#111" }}>{te("total")}</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={4} style={{ color: "#999", textAlign: "center", padding: "10px", fontSize: "13px", border: "1px solid #333" }}>{te("sin_materials")}</td></tr>
          ) : items.map((item, idx) => (
            <tr key={idx}>
              <td style={{ border: "1px solid #333", padding: "10px 12px", fontSize: "13px", color: "#111" }}>{item.descripcion}</td>
              <td style={{ border: "1px solid #333", padding: "10px 12px", textAlign: "right", fontSize: "13px", color: "#111" }}>{item.cantidad}</td>
              <td style={{ border: "1px solid #333", padding: "10px 12px", textAlign: "right", fontSize: "13px", color: "#111" }}>{estimado.moneda} {Number(item.precio_unitario).toFixed(2)}</td>
              <td style={{ border: "1px solid #333", padding: "10px 12px", textAlign: "right", fontSize: "13px", color: "#111" }}>{estimado.moneda} {Number(item.cantidad * item.precio_unitario).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
        <table style={{ width: "200px", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "bold", border: "none", fontSize: "13px", color: "#111" }}>{te("subtotal")}:</td>
              <td style={{ padding: "6px 10px", textAlign: "right", border: "none", fontSize: "13px", color: "#111" }}>{estimado.moneda} {subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "bold", border: "none", fontSize: "13px", color: "#111" }}>{te("impuesto_nombre")}:</td>
              <td style={{ padding: "6px 10px", textAlign: "right", border: "none", fontSize: "13px", color: "#111" }}>{estimado.moneda} {tax.toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "bold", fontSize: "16px", borderTop: "2px solid #333", color: "#111" }}>{te("total")}:</td>
              <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "bold", fontSize: "16px", borderTop: "2px solid #333", color: "#111" }}>{estimado.moneda} {total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {estimado.notas_adicionales?.trim() && (
        <div style={{ marginTop: "20px", padding: "12px", background: "#f9f9f9", borderRadius: "4px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "4px", fontSize: "12px" }}>{te("notas_adicionales")}</div>
          <p style={{ fontSize: "12px", margin: 0 }}>{estimado.notas_adicionales}</p>
        </div>
      )}

      <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #ccc" }}>
        <p style={{ fontSize: "12px", color: "#666", textAlign: "center", margin: 0 }}>{te("footer_mensaje_1")}</p>
        <p style={{ fontSize: "12px", color: "#666", textAlign: "center", margin: 0 }}>{te("footer_mensaje_2")}</p>
      </div>
    </div>
  );
};

export default EstimadosPage;
