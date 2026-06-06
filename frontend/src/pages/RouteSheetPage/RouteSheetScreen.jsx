// src/pages/RouteSheetPage/RouteSheetScreen.jsx
import React from "react";
import InvoiceHeader from "../InvoicePage/InvoiceHeader";

export default function RouteSheetScreen({ data }) {
  const { fecha, conductor, camion, clientes = [] } = data || {};
  const rows = clientes.length > 0
    ? [...clientes, ...Array.from({ length: Math.max(0, 8 - clientes.length) }, () => ({}))]
    : Array.from({ length: 8 }, () => ({}));

  return (
    <div className="route-sheet-page">
      <InvoiceHeader />

      <table className="route-top-table">
        <tbody>
          <tr>
            <td><strong>Date:</strong> {fecha || ""}</td>
            <td><strong>Driver/helper:</strong> {conductor || ""}</td>
            <td><strong>Truck:</strong> {camion || ""}</td>
          </tr>
        </tbody>
      </table>

      <h2 className="invoice-title">Route Sheet</h2>

      <table className="route-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>In</th>
            <th>Out</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c, i) => (
            <tr key={i}>
              <td>
                {c.cliente_nombre && <div className="route-customer-name">{c.cliente_nombre}</div>}
                {c.cliente_direccion && <div className="route-customer-address">{c.cliente_direccion}</div>}
              </td>
              <td>{c.hora_entrada || ""}</td>
              <td>{c.hora_salida || ""}</td>
              <td>{c.descripcion || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
