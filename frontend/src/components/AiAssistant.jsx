import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";

const BOT_ICON = "M12 2a8 8 0 0 0-8 8v2a4 4 0 0 0-2 3.5V17a2 2 0 0 0 2 2h1v1a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-1h1a2 2 0 0 0 2-2v-1.5a4 4 0 0 0-2-3.5v-2a8 8 0 0 0-8-8m-3 9a2 2 0 1 1 4 0 2 2 0 0 1-4 0m6 0a2 2 0 1 1 4 0 2 2 0 0 1-4 0m-6 4a6 6 0 0 0 6 2 6 6 0 0 0 6-2";

const SEND_ICON = "M22 2 11 13M22 2l-7 20-4-9-9-4z";
const CLOSE_ICON = "M18 6 6 18M6 6l12 12";
const WIFI_OFF_ICON = "M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M3 11a9 9 0 0 1 12.5-1.5M18 11a9 9 0 0 1 1.5 1.5";

const renderMarkdown = (text) => {
  let html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
  return html;
};

const AiAssistant = () => {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (open) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, messages, scrollToBottom]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading || !online) return;

    setInput("");
    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const history = messages.map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, stream: true }),
      });

      if (!res.ok) {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: "Error al obtener respuesta." };
          return copy;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) { // eslint-disable-line no-constant-condition
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.done) break;
            if (data.content) {
              setMessages((prev) => {
                const copy = [...prev];
                const last = { ...copy[copy.length - 1] };
                last.content += data.content;
                copy[copy.length - 1] = last;
                return copy;
              });
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: "Error de conexion. Verifica tu internet." };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <button
        className="ai-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={t(lang, "ai_toggle")}
        data-open={open}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={BOT_ICON} />
        </svg>
      </button>

      <div className="ai-panel" data-open={open}>
        <div className="ai-header">
          <div className="ai-header-left">
            <div className="ai-header-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={BOT_ICON} />
              </svg>
            </div>
            <div>
              <span className="ai-header-title">{t(lang, "ai_title")}</span>
              <span className="ai-header-status" data-online={online}>
                {online ? t(lang, "ai_online") : t(lang, "ai_offline")}
              </span>
            </div>
          </div>
          <button className="ai-close-btn" onClick={() => setOpen(false)} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={CLOSE_ICON} />
            </svg>
          </button>
        </div>

        <div className="ai-messages">
          {messages.length === 0 && (
            <div className="ai-welcome">
              <div className="ai-welcome-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={BOT_ICON} />
                </svg>
              </div>
              <p className="ai-welcome-text">{t(lang, "ai_welcome")}</p>
              <div className="ai-suggestions">
                {["¿Cómo agrego un cliente?", "¿Qué campos tiene una factura?", "¿Cómo hago un backup?", "¿Cómo imprimo una propuesta?"].map((s) => (
                  <button
                    key={s}
                    className="ai-suggestion-btn"
                    onClick={() => {
                      setInput(s);
                      inputRef.current?.focus();
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`ai-msg ai-msg--${msg.role}`}>
              {msg.role === "assistant" && (
                <div className="ai-msg-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={BOT_ICON} />
                  </svg>
                </div>
              )}
              <div className="ai-msg-bubble">
                {msg.content || (loading && i === messages.length - 1) ? (
                  <p dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                ) : (
                  <div className="ai-typing"><span /><span /><span /></div>
                )}
              </div>
            </div>
          ))}

          {!online && messages.length > 0 && (
            <div className="ai-offline-banner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={WIFI_OFF_ICON} />
              </svg>
              <span>{t(lang, "ai_offline_msg")}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="ai-footer">
          <div className="ai-input-wrap">
            <textarea
              ref={inputRef}
              className="ai-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t(lang, "ai_placeholder")}
              rows={1}
              disabled={loading}
            />
            <button
              className="ai-send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || loading || !online}
              aria-label="Enviar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={SEND_ICON} />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AiAssistant;
