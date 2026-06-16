const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const { pollBackend } = require("./pollBackend");

let mainWindow;
let backendProcess;

const isDev = !app.isPackaged;

function getBackendDir() {
  return isDev
    ? path.join(__dirname, "..", "backend")
    : path.join(process.resourcesPath, "backend");
}

function getNodePath() {
  if (isDev) return "node";
  return path.join(process.resourcesPath, "node-bin", "win-x64", "node.exe");
}

function startBackend() {
  const backendDir = getBackendDir();
  const nodePath = getNodePath();
  const backendPath = path.join(backendDir, "src", "server.js");
  backendProcess = spawn(nodePath, [backendPath], {
    cwd: backendDir,
    stdio: "inherit",
    shell: true,
  });

  backendProcess.on("error", (err) => {
    console.error("Error iniciando backend:", err);
  });

  backendProcess.on("close", (code) => {
    console.log(`Backend cerrado con código: ${code}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "build", "icon.ico"),
    show: false,
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  const startUrl = isDev
    ? "http://localhost:5173"
    : `file://${path.join(process.resourcesPath, "backend", "public", "index.html")}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  startBackend();
  try {
    await pollBackend();
    console.log("Backend listo, abriendo ventana");
  } catch (err) {
    console.error(err.message);
  }
  createWindow();
});

app.on("window-all-closed", () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});