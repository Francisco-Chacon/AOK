import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";
import Modal from "./Modal";

const KEY_ICON = "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4";
const EYE_SHOW = "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22";
const EYE_HIDE = "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24";
const CLOSE_ICON = "M18 6 6 18 M6 6l12 12";

const SettingsModal = ({ onClose }) => {
  const { lang } = useLanguage();
  const [key, setKey] = useState("");
  const [hasKey, setHasKey] = useState(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showKey, setShowKey] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    fetch("/api/config/openrouter-key")
      .then((r) => r.json())
      .then((data) => setHasKey(data.hasKey))
      .catch(() => setHasKey(false));
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const handleSave = async () => {
    const trimmed = key.trim();
    if (!trimmed) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/config/openrouter-key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: trimmed }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: t(lang, "settings_saved") });
        setHasKey(true);
        setKey("");
        setTimeout(() => onClose(), 1200);
      } else {
        setMessage({ type: "error", text: t(lang, "settings_error") });
      }
    } catch {
      setMessage({ type: "error", text: t(lang, "settings_error") });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/config/openrouter-key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "" }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: t(lang, "settings_removed") });
        setHasKey(false);
        setKey("");
      } else {
        setMessage({ type: "error", text: t(lang, "settings_error") });
      }
    } catch {
      setMessage({ type: "error", text: t(lang, "settings_error") });
    } finally {
      setRemoving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") onClose();
  };

  return (
    <Modal open={true} onClose={onClose}>
      <div className="support-card">
        <button className="support-card-close" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={CLOSE_ICON} />
          </svg>
        </button>
        <div className="support-card-top">
          <div className="support-card-avatar" style={{ background: "linear-gradient(135deg, rgb(var(--primary)), #818cf8)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28, color: "#fff" }}>
              <path d={KEY_ICON} />
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-main)", margin: 0, lineHeight: 1.2 }}>{t(lang, "settings_title")}</h2>
          <p className="support-card-role">{t(lang, "settings_api_key_label")}</p>
        </div>

        <div className="support-card-divider" />

        <div className="support-card-body" style={{ textAlign: "left" }}>
          {hasKey === true && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 500, background: "rgba(var(--success),0.12)", color: "rgb(var(--success))" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              {t(lang, "settings_key_configured")}
            </div>
          )}
          {hasKey === false && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 500, background: "rgba(var(--destructive),0.12)", color: "rgb(var(--destructive))" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18 M6 6l12 12" /></svg>
              {t(lang, "settings_key_not_configured")}
            </div>
          )}

          <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, margin: 0, marginTop: hasKey !== null ? 12 : 0 }}>
            {hasKey ? t(lang, "settings_key_replace_hint") : t(lang, "settings_api_key_hint")}
          </p>

          <div style={{ position: "relative", marginTop: 4 }}>
            <input
              ref={inputRef}
              type={showKey ? "text" : "password"}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hasKey ? "••••••••••••••••" : "sk-or-v1-..."}
              className="input"
              style={{ paddingRight: 40 }}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              onClick={() => setShowKey((v) => !v)}
              tabIndex={-1}
              style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-muted)", padding: 4, display: "flex",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={showKey ? EYE_HIDE : EYE_SHOW} />
              </svg>
            </button>
          </div>

          {message && (
            <div
              style={{
                borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 500,
                background: message.type === "success" ? "rgba(var(--success),0.12)" : "rgba(var(--destructive),0.12)",
                color: message.type === "success" ? "rgb(var(--success))" : "rgb(var(--destructive))",
              }}
            >
              {message.text}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "4px 24px 20px", width: "100%" }}>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: 13 }}>
            {t(lang, "settings_cancel")}
          </button>
          {hasKey && (
            <button className="btn btn-danger" onClick={handleRemove} disabled={removing} style={{ fontSize: 13 }}>
              {removing ? t(lang, "settings_removing") : t(lang, "settings_remove")}
            </button>
          )}
          <button className="btn-primary" onClick={handleSave} disabled={saving || !key.trim()} style={{ fontSize: 13 }}>
            {saving ? t(lang, "settings_saving") : t(lang, "settings_save")}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
