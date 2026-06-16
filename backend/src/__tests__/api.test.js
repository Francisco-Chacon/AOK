import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { tmpdir } from "os";
import { join } from "path";
import { mkdtempSync, rmSync } from "fs";

let tmpDir;
let app;

beforeAll(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "test-"));
  const dbPath = join(tmpDir, "test.db");
  process.env.TEST_DB_PATH = dbPath;
  app = require("../app");
});

afterAll(() => {
  delete process.env.TEST_DB_PATH;
  try { if (tmpDir) rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { /* ignore cleanup errors */ }
});

// ===================== CLIENTES =====================

describe("GET /api/clientes", () => {
  it("devuelve lista vacía al inicio", async () => {
    const res = await request(app).get("/api/clientes");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("POST /api/clientes", () => {
  it("crea un cliente correctamente", async () => {
    const payload = {
      nombre: "Juan Perez",
      direccion: "Calle 123",
      telefono: "555-0100",
      email: "juan@test.com",
      tipo_servicio: "Limpieza",
      estado: "activo",
    };
    const res = await request(app).post("/api/clientes").send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      nombre: "Juan Perez",
      servicio: "Limpieza",
      estado: "activo",
    });
    expect(res.body.id).toBeGreaterThan(0);
  });

  it("rechaza cliente sin nombre", async () => {
    const res = await request(app).post("/api/clientes").send({ tipo_servicio: "X" });
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/clientes/:id", () => {
  it("actualiza un cliente existente", async () => {
    const res = await request(app).put("/api/clientes/1").send({
      nombre: "Juan Actualizado",
      tipo_servicio: "Limpieza",
      estado: "activo",
    });
    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe("Juan Actualizado");
  });

  it("devuelve 404 si el cliente no existe", async () => {
    const res = await request(app).put("/api/clientes/999").send({
      nombre: "Nadie",
      tipo_servicio: "X",
      estado: "activo",
    });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/clientes/:id", () => {
  it("elimina un cliente existente", async () => {
    const res = await request(app).delete("/api/clientes/1");
    expect(res.status).toBe(204);
  });

  it("devuelve 404 al eliminar inexistente", async () => {
    const res = await request(app).delete("/api/clientes/999");
    expect(res.status).toBe(404);
  });
});

// ===================== RUTAS (nuevo endpoint) =====================

describe("RUTAS /api/rutas", () => {
  it("GET devuelve lista vacía", async () => {
    const res = await request(app).get("/api/rutas");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("POST crea una ruta", async () => {
    const res = await request(app).post("/api/rutas").send({
      nombre: "Ruta Norte",
      dia: "lunes",
      tipo_servicio: "Mantenimiento",
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ nombre: "Ruta Norte", dia: "lunes" });
  });

  it("POST rechaza ruta sin nombre", async () => {
    const res = await request(app).post("/api/rutas").send({ dia: "lunes" });
    expect(res.status).toBe(400);
  });

  it("POST rechaza día inválido", async () => {
    const res = await request(app).post("/api/rutas").send({ nombre: "Test", dia: "febrero" });
    expect(res.status).toBe(400);
  });

  it("PUT actualiza ruta", async () => {
    const res = await request(app).put("/api/rutas/1").send({
      nombre: "Ruta Sur",
      dia: "lunes",
    });
    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe("Ruta Sur");
  });

  it("DELETE elimina ruta", async () => {
    const res = await request(app).delete("/api/rutas/1");
    expect(res.status).toBe(204);
  });
});

// ===================== VISITAS =====================

describe("VISITAS /api/visitas", () => {
  it("GET devuelve lista vacía", async () => {
    const res = await request(app).get("/api/visitas");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ===================== RECIBOS =====================

describe("RECIBOS /api/recibos", () => {
  it("GET devuelve lista vacía", async () => {
    const res = await request(app).get("/api/recibos");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ===================== ESTIMADOS =====================

describe("ESTIMADOS /api/estimados", () => {
  it("GET devuelve lista vacía", async () => {
    const res = await request(app).get("/api/estimados");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ===================== FACTURAS =====================

describe("FACTURAS /api/facturas", () => {
  it("GET devuelve lista vacía", async () => {
    const res = await request(app).get("/api/facturas");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ===================== RUTAS HOJAS =====================

describe("RUTAS-HOJAS /api/rutas-hojas", () => {
  it("GET devuelve lista vacía", async () => {
    const res = await request(app).get("/api/rutas-hojas");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ===================== BACKUPS =====================

describe("BACKUPS /api/backups", () => {
  it("falla con 404 en test (no hay BD real)", async () => {
    const res = await request(app).get("/api/backups");
    expect(res.status).toBe(404);
  });
});
