import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "../App";

describe("App component", () => {
  it("renderiza sin errores", () => {
    render(<App />);
    expect(screen.getByText("Sistema de Gestión")).toBeDefined();
  });

  it("muestra el sidebar con opciones principales", () => {
    render(<App />);
    expect(screen.getAllByText("Clientes").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Recibos").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Facturas").length).toBeGreaterThanOrEqual(1);
  });
});
