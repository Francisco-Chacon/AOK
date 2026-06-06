import React from "react";
import "./ProposalPreview.css";
import { useLanguage } from "../../i18n/LanguageContext";
import { t } from "../../i18n/translations";
import { sanitizeHtml } from "../../utils/sanitize";

const ProposalPreview = ({ estimado, onClose }) => {
  const { lang } = useLanguage();
  if (!estimado) return null;

  const empresaNombre = t(lang, "empresa_nombre") || "MAKE IT TO HAPPEN LLC";
  const empresaTelefono = t(lang, "empresa_telefono") || "385-601-8129";
  const empresaEmail = t(lang, "empresa_email") || "makeithappenllc@gmail.com";
  const empresaDireccion = t(lang, "empresa_direccion") || "PO BOX 18670 Salt Lake City UT 84118";

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
      gap: 20px;
      margin-bottom: 15px;
    }
    .proposal-logo {
      width: 140px;
      height: auto;
      object-fit: contain;
    }
    .proposal-company-info {
      text-align: center;
      line-height: 1.2;
    }
    .proposal-company-info h1 {
      font-size: 24px;
      letter-spacing: 2px;
      color: #9b1c1c;
      margin: 0 0 5px 0;
      font-weight: 800;
    }
    .proposal-company-info p {
      margin: 2px 0;
      font-size: 12px;
      font-weight: bold;
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
    .proposal-info-table td:first-child {
      width: 180px;
      font-weight: bold;
      background: #f7f7f7;
    }
    .proposal-description {
      min-height: 450px;
      padding: 20px;
      text-align: center;
    }
    .proposal-description p {
      white-space: pre-line;
      font-size: 12px;
      line-height: 1.8;
      overflow-wrap: anywhere;
    }
    .proposal-footer {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      margin-top: 20px;
    }
    @media print {
      body { margin: 0; }
      .proposal-page { padding: 0.4in 0.5in; }
    }
    @page { size: letter; margin: 0; }
  </style>
</head>
<body>
  <div class="proposal-page">
    <header class="proposal-header">
      <img src="${window.location.origin}/logo.jpg" alt="Logo" class="proposal-logo" />
      <div class="proposal-company-info">
        <h1>${escapeHtml(empresaNombre)}</h1>
        ${empresaTelefono ? `<p>${escapeHtml(empresaTelefono)}</p>` : ""}
        ${empresaEmail ? `<p>${escapeHtml(empresaEmail)}</p>` : ""}
        ${empresaDireccion ? `<p>${escapeHtml(empresaDireccion)}</p>` : ""}
      </div>
    </header>

    <h2 class="proposal-title">${escapeHtml(labelTitle)}</h2>

    <table class="proposal-info-table">
      <tbody>
        <tr>
          <td>${escapeHtml(labelEffectiveDate)}:</td>
          <td>${escapeHtml(effectiveDate)}</td>
        </tr>
        <tr>
          <td>${escapeHtml(labelCustomer)}:</td>
          <td>${escapeHtml(customerName)}</td>
        </tr>
        <tr>
          <td>${escapeHtml(labelAddress)}:</td>
          <td>${escapeHtml(jobAddress)}</td>
        </tr>
        <tr>
          <td>${escapeHtml(labelPhone)}:</td>
          <td>${escapeHtml(phone)}</td>
        </tr>
        <tr>
          <td>${escapeHtml(labelEmail)}:</td>
          <td>${escapeHtml(email)}</td>
        </tr>
        <tr>
          <td>${escapeHtml(labelStartDate)}:</td>
          <td>${escapeHtml(effectiveDate)}</td>
        </tr>
        <tr>
          <td>${escapeHtml(labelEndDate)}:</td>
          <td>${escapeHtml(endDate)}</td>
        </tr>
      </tbody>
    </table>

    <section class="proposal-description">
      <p>${escapeHtml(description)}</p>
    </section>

    <footer class="proposal-footer">
      <div><strong>${escapeHtml(labelAmount)}:</strong> ${escapeHtml(currency)} ${escapeHtml(amount)}</div>
      <div><strong>${escapeHtml(labelDate)}:</strong> ${escapeHtml(effectiveDate)}</div>
    </footer>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`);
    printWindow.document.close();
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
      </div>

      <div className="proposal-page">
        <header className="proposal-header">
          <img src="/logo.jpg" alt="Company Logo" className="proposal-logo" />
          <div className="proposal-company-info">
            <h1>{empresaNombre}</h1>
            {empresaTelefono && <p>{empresaTelefono}</p>}
            {empresaEmail && <p>{empresaEmail}</p>}
            {empresaDireccion && <p>{empresaDireccion}</p>}
          </div>
        </header>

        <h2 className="proposal-title">{labelTitle}</h2>

        <table className="proposal-info-table">
          <tbody>
            <tr>
              <td>{labelEffectiveDate}:</td>
              <td>{effectiveDate}</td>
            </tr>
            <tr>
              <td>{labelCustomer}:</td>
              <td>{customerName}</td>
            </tr>
            <tr>
              <td>{labelAddress}:</td>
              <td>{jobAddress}</td>
            </tr>
            <tr>
              <td>{labelPhone}:</td>
              <td>{phone}</td>
            </tr>
            <tr>
              <td>{labelEmail}:</td>
              <td>{email}</td>
            </tr>
            <tr>
              <td>{labelStartDate}:</td>
              <td>{effectiveDate}</td>
            </tr>
            <tr>
              <td>{labelEndDate}:</td>
              <td>{endDate}</td>
            </tr>
          </tbody>
        </table>

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
  );
};

export default ProposalPreview;
