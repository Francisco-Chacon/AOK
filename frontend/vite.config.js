// frontend/vite.config.js
const path = require("path");

module.exports = {
  server: {
    port: 5173,
  },
  build: {
    outDir: path.resolve(__dirname, "../backend/public"),
    emptyOutDir: true,
  },
};