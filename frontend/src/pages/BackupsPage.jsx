// frontend/src/pages/BackupsPage.jsx
import React, { useEffect, useState } from "react";
import Modal from "../components/Modal";
import { useLanguage } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const BackupsPage = () => {
  const { lang } = useLanguage();
  const [backups, setBackups] = useState([]);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Subir backup
  const [backupFile, setBackupFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Modal eliminar backup
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState(null);

  // Modal crear backup
  const [confirmCreateOpen, setConfirmCreateOpen] = useState(false);

  // Modal restaurar backup
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
  const [backupToRestore, setBackupToRestore] = useState(null);

  // Mensajes dentro de la página
  // { type: "success" | "error", text: string }
  const [feedback, setFeedback] = useState(null);

  const showSuccess = (text) => setFeedback({ type: "success", text });
  const showError = (text) => setFeedback({ type: "error", text });

  const fetchBackups = async () => {
    try {
      setLoadingList(true);
      const res = await fetch(`${API_BASE}/backups/list`);
      const data = await res.json();
      if (data.ok) {
        setBackups(data.files || []);
      } else {
        showError(data.message || "Error al cargar backups.");
      }
    } catch (err) {
      console.error(err);
      showError("Error al cargar la lista de backups.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  // ---------- CREAR BACKUP ----------

  const openCreateConfirm = () => {
    setConfirmCreateOpen(true);
  };

  const cancelCreate = () => {
    if (loadingCreate) return;
    setConfirmCreateOpen(false);
  };

  const handleCreateBackup = async () => {
    try {
      setLoadingCreate(true);
      const res = await fetch(`${API_BASE}/backups/create`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.ok) {
        showSuccess(data.message || "Backup creado correctamente.");
        fetchBackups();
      } else {
        showError(data.message || "Error al crear backup.");
      }
    } catch (err) {
      console.error(err);
      showError("Error al crear backup.");
    } finally {
      setLoadingCreate(false);
      setConfirmCreateOpen(false);
    }
  };

  // ---------- DESCARGAR ----------

  const handleDownload = (filename) => {
    window.open(
      `${API_BASE}/backups/download/${encodeURIComponent(filename)}`,
      "_blank"
    );
  };

  // ---------- RESTAURAR BACKUP (con modal) ----------

  const askRestore = (filename) => {
    setBackupToRestore(filename);
    setConfirmRestoreOpen(true);
  };

  const cancelRestore = () => {
    if (loadingRestore) return;
    setConfirmRestoreOpen(false);
    setBackupToRestore(null);
  };

  const confirmRestore = async () => {
    if (!backupToRestore) return;

    try {
      setLoadingRestore(true);
      const res = await fetch(`${API_BASE}/backups/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: backupToRestore }),
      });
      const data = await res.json();
      if (data.ok) {
        showSuccess(
          data.message ||
            "Backup restaurado correctamente. Reinicia el backend para asegurar que todo se actualice."
        );
      } else {
        showError(data.message || "Error al restaurar el backup.");
      }
    } catch (err) {
      console.error(err);
      showError("Error al restaurar el backup.");
    } finally {
      setLoadingRestore(false);
      setConfirmRestoreOpen(false);
      setBackupToRestore(null);
    }
  };

  // ---------- ELIMINAR BACKUP (con modal) ----------

  const askDelete = (filename) => {
    setBackupToDelete(filename);
    setConfirmDeleteOpen(true);
  };

  const cancelDelete = () => {
    if (loadingDelete) return;
    setConfirmDeleteOpen(false);
    setBackupToDelete(null);
  };

  const confirmDelete = async () => {
    if (!backupToDelete) return;

    try {
      setLoadingDelete(true);
      const res = await fetch(
        `${API_BASE}/backups/${encodeURIComponent(backupToDelete)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.ok) {
        showSuccess(data.message || "Backup eliminado correctamente.");
        fetchBackups();
      } else {
        showError(data.message || "Error al eliminar el backup.");
      }
    } catch (err) {
      console.error(err);
      showError("Error al eliminar el backup.");
    } finally {
      setLoadingDelete(false);
      setConfirmDeleteOpen(false);
      setBackupToDelete(null);
    }
  };

  const backupsFiltrados = backups.filter((f) => {
    if (!debouncedQuery) return true;
    return f.toLowerCase().includes(debouncedQuery.toLowerCase());
  });

  // ---------- SUBIR BACKUP ----------

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setBackupFile(file || null);
  };

  const handleUploadBackup = async () => {
    if (!backupFile) {
      showError("Selecciona un archivo .db primero.");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      // 'backup' debe coincidir con upload.single("backup") en el backend
      formData.append("backup", backupFile);

      const res = await fetch(`${API_BASE}/backups/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.ok) {
        showSuccess(data.message || "Backup subido correctamente.");
        setBackupFile(null);
        // refrescamos la lista para que aparezca el nuevo archivo
        fetchBackups();
      } else {
        showError(data.message || "Error al subir el backup.");
      }
    } catch (err) {
      console.error(err);
      showError("Error al subir el backup.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header-main">
          <h1 className="page-title">{t(lang, "backups")}</h1>
          <p className="page-subtitle">
            {t(lang, "backups_page_subtitle")}
          </p>
        </div>

        <div className="backups-actions">
          <button
            className="btn btn-primary"
            onClick={openCreateConfirm}
            disabled={loadingCreate}
          >
            {loadingCreate ? t(lang, "creando_backup") : t(lang, "crear_backup")}
          </button>

          <button
            className="btn btn-outline"
            onClick={fetchBackups}
            disabled={loadingList}
          >
            {loadingList ? t(lang, "actualizando_lista") : t(lang, "actualizar_lista")}
          </button>
        </div>
      </header>

      {/* Mensaje dentro de la página */}
      {feedback && (
        <div
          className={
            "alert " +
            (feedback.type === "error" ? "alert-error" : "alert-success")
          }
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setFeedback(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Sección para subir backup */}
      <section className="card" style={{ marginTop: "1rem" }}>
        <h2>{t(lang, "subir_desde_archivo")}</h2>
        <p className="muted">
          {t(lang, "subir_backup_desc")}
        </p>

        <div className="upload-row">
          <label className="file-input-label">
            <input
              type="file"
              accept=".db"
              onChange={handleFileChange}
              className="file-input-hidden"
            />
            <span className="file-input-btn">
              {backupFile ? backupFile.name : t(lang, "seleccionar_archivo")}
            </span>
          </label>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUploadBackup}
            disabled={uploading || !backupFile}
          >
            {uploading ? t(lang, "subiendo") : t(lang, "subir_backup_btn")}
          </button>
        </div>
      </section>

      <div className="page-toolbar">
        <input
          className="input search-bar"
          placeholder={t(lang, "busqueda")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Lista de backups */}
      <div className="list" style={{ marginTop: "1rem" }}>
        {backupsFiltrados.length === 0 ? (
          <div className="card">
            <div className="card-main">
              <p className="card-title">{t(lang, "sin_backups")}</p>
              <p className="card-text muted">
                {t(lang, "sin_backups_desc")}
              </p>
            </div>
          </div>
        ) : (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>{t(lang, "archivo")}</th>
                  <th style={{ width: "320px" }}>{t(lang, "acciones")}</th>
                </tr>
              </thead>
              <tbody>
                {backupsFiltrados.map((file) => (
                  <tr key={file}>
                    <td>{file}</td>
                    <td className="table-actions">
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => handleDownload(file)}
                      >
                        {t(lang, "descargar")}
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => askRestore(file)}
                      >
                        {t(lang, "restaurar")}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => askDelete(file)}
                      >
                        {t(lang, "eliminar")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="muted" style={{ marginTop: "0.4rem" }}>
          ⚠️ {t(lang, "advertencia_restaurar")}
        </p>
      </div>

      {/* Modal CREAR backup */}
      <Modal
        open={confirmCreateOpen}
        title={t(lang, "crear_backup_title")}
        onClose={cancelCreate}
      >
        <p>
          {t(lang, "crear_backup_desc")}
        </p>
        <p className="muted" style={{ marginTop: "0.4rem" }}>
          {t(lang, "crear_backup_recomendacion")}
        </p>
        <div className="form-actions" style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={cancelCreate}
            disabled={loadingCreate}
          >
            {t(lang, "cancelar")}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCreateBackup}
            disabled={loadingCreate}
          >
            {loadingCreate ? t(lang, "creando_backup") : t(lang, "si_crear_backup")}
          </button>
        </div>
      </Modal>

      {/* Modal RESTAURAR backup */}
      <Modal
        open={confirmRestoreOpen}
        title={t(lang, "restaurar_backup_title")}
        onClose={cancelRestore}
      >
        <p>
          {t(lang, "restaurar_backup_text")} <strong>{backupToRestore}</strong>.
        </p>
        <p className="muted" style={{ marginTop: "0.4rem" }}>
          {t(lang, "restaurar_backup_advertencia")}
        </p>
        <div className="form-actions" style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={cancelRestore}
            disabled={loadingRestore}
          >
            {t(lang, "cancelar")}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={confirmRestore}
            disabled={loadingRestore}
          >
            {loadingRestore ? t(lang, "restaurando") : t(lang, "si_restaurar_backup")}
          </button>
        </div>
      </Modal>

      {/* Modal ELIMINAR backup */}
      <Modal
        open={confirmDeleteOpen}
        title={t(lang, "confirmar_eliminar_backup")}
        onClose={cancelDelete}
      >
        <p>
          {t(lang, "seguro_eliminar_backup")}
          <strong>{backupToDelete}</strong>. {t(lang, "seguro_eliminar_backup_desc")}
        </p>
        <div className="form-actions" style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={cancelDelete}
            disabled={loadingDelete}
          >
            {t(lang, "cancelar")}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={confirmDelete}
            disabled={loadingDelete}
          >
            {loadingDelete ? t(lang, "eliminando") : t(lang, "si_eliminar")}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default BackupsPage;
