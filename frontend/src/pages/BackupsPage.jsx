// frontend/src/pages/BackupsPage.jsx
import React, { useEffect, useState } from "react";
import Modal from "../components/Modal";
import SearchBar from "../components/SearchBar";
import { useLanguage } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";
import api from "../api/apiClient";

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
      const { data } = await api.get("/backups/list");
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
    api.get("/backups/list").then(({ data }) => {
      if (data.ok) setBackups(data.files || []);
    }).catch((err) => {
      console.error(err);
    });
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
      const { data } = await api.post("/backups/create");
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
      `${api.defaults.baseURL}/backups/download/${encodeURIComponent(filename)}`,
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
      const { data } = await api.post("/backups/restore", {
        filename: backupToRestore,
      });
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
      const { data } = await api.delete(
        `/backups/${encodeURIComponent(backupToDelete)}`
      );
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
      formData.append("backup", backupFile);

      const { data } = await api.post("/backups/upload", formData);
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
    <div className="page mx-auto w-full max-w-6xl">
      <header className="page-header mb-6 flex items-center justify-between gap-4 rounded-3xl border border-[var(--record-border)] bg-[var(--bg-panel)] px-5 py-5 shadow-[var(--shadow-soft)] backdrop-blur">
        <div className="page-header-main flex flex-col gap-1">
          <h1 className="page-title text-3xl font-bold tracking-[-0.035em] text-[var(--text-main)]">{t(lang, "backups")}</h1>
          <p className="page-subtitle text-sm text-[var(--text-muted)]">
            {t(lang, "backups_page_subtitle")}
          </p>
        </div>

        <div className="backups-actions flex shrink-0 gap-2">
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18 M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Sección para subir backup */}
      <section className="card mt-4 flex justify-between gap-5 rounded-xl border border-[var(--record-border)] bg-[var(--bg-card)] p-5 shadow-[var(--record-shadow)] backdrop-blur">
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

      <div className="page-toolbar backups-search-toolbar mb-5 mt-6 flex items-center justify-between gap-4">
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t(lang, "busqueda")}
        />
      </div>

      {/* Lista de backups */}
      <div className="list mt-4 flex flex-col gap-3">
        {backupsFiltrados.length === 0 ? (
          <div className="card flex justify-between gap-5 rounded-xl border border-[var(--record-border)] bg-[var(--bg-card)] p-5 shadow-[var(--record-shadow)]">
            <div className="card-main flex flex-col gap-1">
              <p className="card-title font-bold text-[var(--text-main)]">{t(lang, "sin_backups")}</p>
              <p className="card-text muted text-sm text-[var(--text-muted)]">
                {t(lang, "sin_backups_desc")}
              </p>
            </div>
          </div>
        ) : (
          <div className="card flex justify-between gap-5 rounded-xl border border-[var(--record-border)] bg-[var(--bg-card)] p-5 shadow-[var(--record-shadow)]">
            <table className="table">
              <thead>
                <tr>
                  <th>{t(lang, "archivo")}</th>
                  <th className="th-actions">{t(lang, "acciones")}</th>
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
                        className="btn-action btn-action--delete"
                        onClick={() => askDelete(file)}
                      >
                        <svg className="btn-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                        {t(lang, "eliminar")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="muted" style={{ marginTop: "0.4rem", display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01" />
          </svg>
          <span>{t(lang, "advertencia_restaurar")}</span>
        </div>
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
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--danger-soft)]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[rgb(var(--destructive))]">
              <path d="M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6" />
            </svg>
          </div>
          <p className="font-semibold text-[var(--text-main)]">
            {t(lang, "seguro_eliminar_backup")}
            <strong>{backupToDelete}</strong>. {t(lang, "seguro_eliminar_backup_desc")}
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn-ghost" onClick={cancelDelete} disabled={loadingDelete}>{t(lang, "cancelar")}</button>
          <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={loadingDelete}>
            {loadingDelete ? (
              <>{t(lang, "eliminando")}...</>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                {t(lang, "si_eliminar")}
              </>
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default BackupsPage;
