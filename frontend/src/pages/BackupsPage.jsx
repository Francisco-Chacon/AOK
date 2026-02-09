// frontend/src/pages/BackupsPage.jsx
import React, { useEffect, useState } from "react";
import Modal from "../components/Modal";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const BackupsPage = () => {
  const [backups, setBackups] = useState([]);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

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
          <h1 className="page-title">Gestión de Backups</h1>
          <p className="page-subtitle">
            Crea copias de seguridad de la base de datos y restaura estados
            anteriores cuando sea necesario.
          </p>
        </div>

        <div className="backups-actions">
          <button
            className="btn btn-primary"
            onClick={openCreateConfirm}
            disabled={loadingCreate}
          >
            {loadingCreate ? "Creando backup..." : "Crear backup ahora"}
          </button>

          <button
            className="btn btn-outline"
            onClick={fetchBackups}
            disabled={loadingList}
          >
            {loadingList ? "Actualizando lista..." : "Actualizar lista"}
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
        <h2>Subir backup desde archivo</h2>
        <p className="muted">
          Puedes cargar un archivo <code>.db</code> que tengas en un USB o que
          venga de otra computadora. Luego podrás restaurarlo desde la tabla de
          backups.
        </p>

        <div className="upload-row">
          <input
            type="file"
            accept=".db"
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleUploadBackup}
            disabled={uploading || !backupFile}
          >
            {uploading ? "Subiendo..." : "Subir backup"}
          </button>
        </div>
      </section>

      {/* Lista de backups */}
      <div className="list" style={{ marginTop: "1rem" }}>
        {backups.length === 0 ? (
          <div className="card">
            <div className="card-main">
              <p className="card-title">No hay backups registrados.</p>
              <p className="card-text muted">
                Crea tu primer backup para mantener segura la información de tus
                clientes, visitas y recibos.
              </p>
            </div>
          </div>
        ) : (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Archivo</th>
                  <th style={{ width: "320px" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((file) => (
                  <tr key={file}>
                    <td>{file}</td>
                    <td className="table-actions">
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => handleDownload(file)}
                      >
                        Descargar
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => askRestore(file)}
                      >
                        Restaurar
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => askDelete(file)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="muted" style={{ marginTop: "0.4rem" }}>
          ⚠️ Antes de restaurar un backup, cierra el sistema; después de
          restaurar, reinicia el backend.
        </p>
      </div>

      {/* Modal CREAR backup */}
      <Modal
        open={confirmCreateOpen}
        title="Crear nuevo backup"
        onClose={cancelCreate}
      >
        <p>
          Se creará una copia de la base de datos actual (clientes, visitas,
          recibos, estimados, etc.). Podrás descargarla o restaurarla más
          adelante.
        </p>
        <p className="muted" style={{ marginTop: "0.4rem" }}>
          Es recomendable realizar el backup en un momento donde no se estén
          registrando muchos cambios.
        </p>
        <div className="form-actions" style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={cancelCreate}
            disabled={loadingCreate}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCreateBackup}
            disabled={loadingCreate}
          >
            {loadingCreate ? "Creando backup..." : "Sí, crear backup"}
          </button>
        </div>
      </Modal>

      {/* Modal RESTAURAR backup */}
      <Modal
        open={confirmRestoreOpen}
        title="Restaurar backup"
        onClose={cancelRestore}
      >
        <p>
          Vas a restaurar el backup <strong>{backupToRestore}</strong>.
        </p>
        <p className="muted" style={{ marginTop: "0.4rem" }}>
          Esto <strong>sobrescribirá la base de datos actual</strong> con el
          estado que tenía cuando se creó este backup. Asegúrate de que nadie
          esté usando el sistema.
        </p>
        <div className="form-actions" style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={cancelRestore}
            disabled={loadingRestore}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={confirmRestore}
            disabled={loadingRestore}
          >
            {loadingRestore ? "Restaurando..." : "Sí, restaurar backup"}
          </button>
        </div>
      </Modal>

      {/* Modal ELIMINAR backup */}
      <Modal
        open={confirmDeleteOpen}
        title="Confirmar eliminación de backup"
        onClose={cancelDelete}
      >
        <p>
          ¿Seguro que deseas eliminar el backup{" "}
          <strong>{backupToDelete}</strong>? Esta acción no se puede
          deshacer, pero no afecta la base de datos actual, solo elimina el
          archivo de copia.
        </p>
        <div className="form-actions" style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={cancelDelete}
            disabled={loadingDelete}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={confirmDelete}
            disabled={loadingDelete}
          >
            {loadingDelete ? "Eliminando..." : "Sí, eliminar"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default BackupsPage;
