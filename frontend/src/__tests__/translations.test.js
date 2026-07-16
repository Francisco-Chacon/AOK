import { describe, it, expect } from "vitest";
import { t, translations } from "../i18n/translations";

describe("t() helper", () => {
  it("devuelve el valor en español si la clave existe", () => {
    expect(t("es", "appName")).toBe("MAKE IT TO HAPPEN LLC");
  });

  it("devuelve el valor en inglés si la clave existe", () => {
    expect(t("en", "appName")).toBe("MAKE IT TO HAPPEN LLC");
  });

  it("devuelve la clave si no existe traducción", () => {
    expect(t("es", "clave_inexistente")).toBe("clave_inexistente");
  });

  it("devuelve la clave si el idioma no existe", () => {
    expect(t("fr", "appName")).toBe("appName");
  });
});

describe("translations object", () => {
  it("tiene las claves principales en español", () => {
    expect(translations.es).toBeDefined();
    expect(translations.es.clientes).toBe("Clientes");
    expect(translations.es.facturas).toBe("Facturas");
  });

  it("tiene las claves principales en inglés", () => {
    expect(translations.en).toBeDefined();
    expect(translations.en.clientes).toBe("Clients");
    expect(translations.en.facturas).toBe("Invoices");
  });

  it("tiene todas las claves de es en en (sin faltantes)", () => {
    const esKeys = Object.keys(translations.es).sort();
    const enKeys = Object.keys(translations.en).sort();
    const missing = esKeys.filter((k) => !enKeys.includes(k));
    expect(missing, `Faltan en inglés: ${missing.join(", ")}`).toEqual([]);
  });
});
