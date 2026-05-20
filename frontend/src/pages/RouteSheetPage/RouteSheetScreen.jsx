// src/pages/RouteSheetPage/RouteSheetScreen.jsx
import React from "react";
import InvoiceHeader from "../InvoicePage/InvoiceHeader";

export default function RouteSheetScreen({ data }) {
  const { fecha, conductor, camion, clientes = [] } = data || {};

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
          {clientes.length > 0 ? (
            clientes.map((c, i) => (
              <tr key={i}>
                <td>{c.cliente_nombre || ""}{c.cliente_direccion ? `\n${c.cliente_direccion}` : ""}</td>
                <td>{c.hora_entrada || ""}</td>
                <td>{c.hora_salida || ""}</td>
                <td>{c.descripcion || ""}</td>
              </tr>
            ))
          ) : (
            Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}