import { describe, it, expect, afterEach } from "vitest";
import http from "http";
import { pollBackend } from "../pollBackend";

describe("pollBackend", () => {
  let server;
  const okPort = 4050;
  const errorPort = 4051;
  const unavailablePort = 4052;

  afterEach(async () => {
    if (!server) return;
    await new Promise((resolve) => server.close(resolve));
    server = undefined;
  });

  it("resuelve cuando el backend responde 200", async () => {
    server = http.createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end("[]");
    });
    await new Promise((resolve) => server.listen(okPort, resolve));
    await expect(pollBackend(5, 50, okPort)).resolves.toBeUndefined();
  }, 10000);

  it("rechaza si el backend nunca responde", async () => {
    await expect(pollBackend(2, 50, unavailablePort)).rejects.toThrow("Backend no disponible");
  }, 10000);

  it("rechaza si el backend responde con error", async () => {
    server = http.createServer((req, res) => {
      res.writeHead(500);
      res.end("Error");
    });
    await new Promise((resolve) => server.listen(errorPort, resolve));
    await expect(pollBackend(3, 50, errorPort)).rejects.toThrow("Backend no respondió");
  }, 10000);
});
