// src/pages/InvoicePage/InvoiceHeader.jsx
import React from "react";

const COMPANY = {
  name: "MAKE IT TO HAPPEN LLC",
  phone: "385-601-8129",
  email: "makeittohappen@gmail.com",
  address: "PO BOX 18670 Salt Lake City, UT 84118",
};

export default function InvoiceHeader() {
  return (
    <div className="invoice-header">
      <img src="/logo.jpg" alt="Company logo" className="invoice-logo" />
      <div className="invoice-company-info">
        <h1>{COMPANY.name}</h1>
        <h2>{COMPANY.phone}</h2>
        <p>{COMPANY.email}</p>
        <p>{COMPANY.address}</p>
      </div>
    </div>
  );
}

export { COMPANY };