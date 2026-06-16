// src/pages/InvoicePage/InvoiceScreen.jsx
import React from "react";
import InvoiceHeader from "./InvoiceHeader";

export default function InvoiceScreen({ data }) {
  const { cliente_nombre, cliente_direccion, cliente_email, cliente_telefono, items = [], nota } = data || {};

  const total = (items || []).reduce((sum, item) => sum + (Number(item.precio) || 0) * (Number(item.cantidad) || 1), 0);

  return (
    <div className="invoice-page">
      <InvoiceHeader />

      <h2 className="invoice-title">Invoice</h2>

      <table className="invoice-info-table">
        <tbody>
          <tr>
            <td><strong>Customer:</strong></td>
            <td>{cliente_nombre || ""}</td>
          </tr>
          <tr>
            <td><strong>Address:</strong></td>
            <td>{cliente_direccion || ""}</td>
          </tr>
          <tr>
            <td><strong>E-mail:</strong></td>
            <td>{cliente_email || ""}</td>
          </tr>
          <tr>
            <td><strong>Phone:</strong></td>
            <td>{cliente_telefono || ""}</td>
          </tr>
        </tbody>
      </table>

      <div className="invoice-section-label">
        Description of the job that was done
      </div>

      <table className="invoice-job-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((item, index) => (
              <tr key={index}>
                <td>{item.fecha || ""}</td>
                <td>{item.descripcion || ""}</td>
                <td>{Number(item.cantidad) || 1}</td>
                <td>${(Number(item.precio) || 0).toFixed(2)}</td>
                <td>${((Number(item.precio) || 0) * (Number(item.cantidad) || 1)).toFixed(2)}</td>
              </tr>
            ))
          ) : (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="invoice-total-row">
        <strong>Total:</strong> ${total.toFixed(2)}
      </div>

      {nota && (
        <div className="invoice-note">
          <p><strong>Note:</strong> {nota}</p>
        </div>
      )}

      <div className="invoice-footer-note">
        <p>Hour Rate $</p>
        <p>
          Invoice must be paid within the next 10 business days.
          Customers with accounts over 30 days past due are subject
          to termination of service. Additional fees apply.
        </p>
      </div>
    </div>
  );
}
