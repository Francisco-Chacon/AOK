// frontend/src/api/apiClient.js
import axios from "axios";

const isFileProtocol = typeof window !== "undefined" && window.location.protocol === "file:";

const api = axios.create({
  baseURL: isFileProtocol ? "http://localhost:4000/api" : "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
