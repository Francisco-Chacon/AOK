import React, { useRef } from "react";
import "./ProposalPreview.css";
import { useLanguage } from "../../i18n/LanguageContext";
import { t } from "../../i18n/translations";
import { sanitizeHtml } from "../../utils/sanitize";
import { useToast } from "../../components/Toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const ProposalPreview = ({ estimado, onClose }) => {
  const { lang } = useLanguage();
  const toast = useToast();
  const proposalRef = useRef(null);
  if (!estimado) return null;

  const escapeHtml = sanitizeHtml;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return dateStr.slice(0, 10);
  };

  const addDays = (dateStr, days) => {
    if (!dateStr) return "";
    const date = new Date(`${dateStr.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "";
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  };

  const rawDescription = (estimado.descripcion_trabajo || "").trim();
  const notes = (estimado.notas_adicionales || "").trim();
  const descriptionLines = rawDescription.split("\n").filter((line) => line.trim());
  const looksLikeOldMaterials =
    descriptionLines.length > 0 &&
    descriptionLines.every((line) => /^(\d+)x\s+.+\s+\(\$[\d.]+\s+c\/u\)$/.test(line.trim()));
  const descripcionTexto = notes
    ? (!rawDescription || looksLikeOldMaterials ? notes : `${rawDescription}\n\n${notes}`)
    : rawDescription;

  const effectiveDate = formatDate(estimado.fecha);
  const endDate = estimado.fecha_validez ? formatDate(estimado.fecha_validez) : addDays(effectiveDate, 30);
  const customerName = estimado.cliente_nombre || t(lang, "cliente_sin_nombre");
  const jobAddress = estimado.direccion_trabajo || t(lang, "sin_direccion");
  const phone = estimado.cliente_telefono || "";
  const email = estimado.cliente_email || "";
  const currency = estimado.moneda || "USD";
  const amount = Number(estimado.monto || 0).toFixed(2);
  const description = descripcionTexto || t(lang, "sin_descripcion");

  const labelEffectiveDate = t(lang, "proposals_effective_date");
  const labelCustomer = t(lang, "proposals_customer");
  const labelAddress = t(lang, "proposals_address");
  const labelPhone = t(lang, "proposals_phone");
  const labelEmail = t(lang, "proposals_email");
  const labelStartDate = t(lang, "proposals_start_date");
  const labelEndDate = t(lang, "proposals_end_date");
  const labelAmount = t(lang, "proposals_amount");
  const labelDate = t(lang, "proposals_date");
  const labelTitle = t(lang, "proposals_title");

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${escapeHtml(labelTitle)} - ${escapeHtml(customerName)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    .proposal-page {
      width: 8.5in;
      min-height: 11in;
      background: #ffffff;
      padding: 0.5in 0.7in;
      margin: 0 auto;
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
    }
    .proposal-header {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 15px;
    }
    .proposal-logo {
      width: 560px;
      max-width: 100%;
      height: auto;
      display: block;
      object-fit: contain;
    }
    .proposal-title {
      text-align: center;
      font-size: 26px;
      margin: 10px 0;
      font-weight: 500;
    }
    .proposal-info-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .proposal-info-table td {
      border: 1px solid #333;
      padding: 4px 8px;
    }
    .proposal-info-table strong {
      font-weight: bold;
    }
    .proposal-body-box {
      border: 0;
    }
    .proposal-description-title {
      border: 1px solid #333;
      border-bottom: 0;
      padding: 5px 8px;
      text-align: center;
      font-size: 12px;
    }
    .proposal-description {
      border: 1px solid #333;
      min-height: 450px;
      padding: 38px 8px 20px;
      text-align: left;
      -webkit-box-decoration-break: clone;
      box-decoration-break: clone;
    }
    .proposal-description p {
      white-space: pre-line;
      font-size: 12px;
      line-height: 1.8;
      text-align: justify;
      overflow-wrap: anywhere;
    }
    .proposal-footer {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      padding: 8px;
      break-inside: avoid;
      page-break-inside: avoid;
      border: 1px solid #333;
      border-top: 0;
    }
    @media print {
      body { margin: 0; }
      .proposal-page { min-height: auto; padding: 0.4in 0.5in; }
      .proposal-description { min-height: auto; }
    }
    @page { size: letter; margin: 0; }
  </style>
</head>
<body>
  <div class="proposal-page">
    <header class="proposal-header">
      <img src="${window.location.origin}/logo.png" alt="Logo" class="proposal-logo" />
    </header>

    <h2 class="proposal-title">${escapeHtml(labelTitle)}</h2>

    <table class="proposal-info-table">
      <tbody>
        <tr>
          <td><strong>${escapeHtml(labelEffectiveDate)}:</strong> ${escapeHtml(effectiveDate)}</td>
        </tr>
        <tr>
          <td><strong>${escapeHtml(labelCustomer)}:</strong> ${escapeHtml(customerName)}</td>
        </tr>
        <tr>
          <td><strong>${escapeHtml(labelAddress)}:</strong> ${escapeHtml(jobAddress)}</td>
        </tr>
        <tr>
          <td><strong>${escapeHtml(labelPhone)}:</strong> ${escapeHtml(phone)}</td>
        </tr>
        <tr>
          <td><strong>${escapeHtml(labelEmail)}:</strong> ${escapeHtml(email)}</td>
        </tr>
        <tr>
          <td><strong>${escapeHtml(labelStartDate)}:</strong> ${escapeHtml(effectiveDate)}</td>
        </tr>
        <tr>
          <td><strong>${escapeHtml(labelEndDate)}:</strong> ${escapeHtml(endDate)}</td>
        </tr>
      </tbody>
    </table>

    <div class="proposal-body-box">
      <div class="proposal-description-title">Description of the job that Make It To Happen will be performing</div>
      <section class="proposal-description">
        <p>${escapeHtml(description)}</p>
      </section>
      <footer class="proposal-footer">
        <div><strong>${escapeHtml(labelAmount)}:</strong> ${escapeHtml(currency)} ${escapeHtml(amount)}</div>
        <div><strong>${escapeHtml(labelDate)}:</strong> ${escapeHtml(effectiveDate)}</div>
      </footer>
    </div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`);
    printWindow.document.close();
  };

  const handleExportPDF = async () => {
    if (!proposalRef.current) return;
    try {
      const canvas = await html2canvas(proposalRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "letter");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      const safeName = customerName.replace(/[^a-zA-Z0-9]/g, "_");
      pdf.save(`Propuesta_${safeName}.pdf`);
      toast("PDF exportado correctamente.", "success");
    } catch (err) {
      console.error("Error generando PDF", err);
      toast("Error al generar el PDF.", "error");
    }
  };

  return (
    <div className="proposal-page-wrapper">
      <div className={`proposal-toolbar ${!onClose ? "proposal-toolbar--end" : ""}`}>
        {onClose && (
          <button className="btn-ghost" onClick={onClose}>
            ← {t(lang, "cerrar")}
          </button>
        )}
        <button className="btn-primary" onClick={handlePrint}>
          {t(lang, "imprimir")}
        </button>
        <button className="btn-ghost" onClick={handleExportPDF}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 inline-block">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          {t(lang, "exportar")}
        </button>
      </div>

      <div className="proposal-page" ref={proposalRef}>
        <header className="proposal-header">
          <img src="/logo.png" alt="Company Logo" className="proposal-logo" />
        </header>

        <h2 className="proposal-title">{labelTitle}</h2>

        <table className="proposal-info-table">
          <tbody>
            <tr>
              <td><strong>{labelEffectiveDate}:</strong> {effectiveDate}</td>
            </tr>
            <tr>
              <td><strong>{labelCustomer}:</strong> {customerName}</td>
            </tr>
            <tr>
              <td><strong>{labelAddress}:</strong> {jobAddress}</td>
            </tr>
            <tr>
              <td><strong>{labelPhone}:</strong> {phone}</td>
            </tr>
            <tr>
              <td><strong>{labelEmail}:</strong> {email}</td>
            </tr>
            <tr>
              <td><strong>{labelStartDate}:</strong> {effectiveDate}</td>
            </tr>
            <tr>
              <td><strong>{labelEndDate}:</strong> {endDate}</td>
            </tr>
          </tbody>
        </table>

        <div className="proposal-body-box">
          <div className="proposal-description-title">Description of the job that Make It To Happen will be performing</div>
          <section className="proposal-description">
            <p>{description}</p>
          </section>
          <footer className="proposal-footer">
            <div className="proposal-amount">
              <strong>{labelAmount}:</strong> {currency} {amount}
            </div>
            <div className="proposal-date">
              <strong>{labelDate}:</strong> {effectiveDate}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ProposalPreview;
