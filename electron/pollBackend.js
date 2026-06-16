const http = require("http");

const BACKEND_PORT = 4000;

function pollBackend(maxRetries = 30, interval = 500, port = BACKEND_PORT) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      const req = http.get(`http://localhost:${port}/api/backups`, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else if (attempts < maxRetries) {
          setTimeout(check, interval);
        } else {
          reject(new Error("Backend no respondió después de varios intentos"));
        }
      });
      req.on("error", () => {
        if (attempts < maxRetries) {
          setTimeout(check, interval);
        } else {
          reject(new Error("Backend no disponible después de varios intentos"));
        }
      });
      req.end();
    };
    check();
  });
}

module.exports = { pollBackend };
