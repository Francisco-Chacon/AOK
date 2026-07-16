import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";

const BOT_ICON = "M12 2a8 8 0 0 0-8 8v2a4 4 0 0 0-2 3.5V17a2 2 0 0 0 2 2h1v1a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-1h1a2 2 0 0 0 2-2v-1.5a4 4 0 0 0-2-3.5v-2a8 8 0 0 0-8-8m-3 9a2 2 0 1 1 4 0 2 2 0 0 1-4 0m6 0a2 2 0 1 1 4 0 2 2 0 0 1-4 0m-6 4a6 6 0 0 0 6 2 6 6 0 0 0 6-2";
const SEND_ICON = "M22 2 11 13M22 2l-7 20-4-9-9-4z";
const WIFI_OFF_ICON = "M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M3 11a9 9 0 0 1 12.5-1.5M18 11a9 9 0 0 1 1.5 1.5";

const renderHtml = (text) => {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
};

const SUGGESTIONS = [
  "ai_suggest_add_client",
  "ai_suggest_invoice_fields",
  "ai_suggest_backup",
  "ai_suggest_print_proposal",
];

const AiPanel = ({ onClose, online }) => {
  const { lang } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading || !online) return;

    setInput("");
    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const history = messages.map(({ role, content }) => ({ role, content }));

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, stream: true }),
      });

      if (!res.ok) {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: t(lang, "ai_error_response") };
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
        copy[copy.length - 1] = { role: "assistant", content: t(lang, "ai_error_connection") };
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
    <aside className="ai-panel-sidebar">
      <div className="ai-panel-sidebar-header">
        <div className="ai-panel-sidebar-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={BOT_ICON} />
          </svg>
          <span>{t(lang, "ai_title")}</span>
        </div>
        <button className="ai-panel-sidebar-close" onClick={onClose} aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="ai-panel-sidebar-status">
        <span className={"statusbar-dot " + (online ? "statusbar-dot--success" : "statusbar-dot--muted")} />
        <span>{online ? t(lang, "ai_online") : t(lang, "ai_offline")}</span>
      </div>

      <div className="ai-panel-sidebar-messages">
        {messages.length === 0 && (
          <div className="ai-welcome">
            <div className="ai-welcome-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={BOT_ICON} />
              </svg>
            </div>
            <p className="ai-welcome-text">{t(lang, "ai_welcome")}</p>
            <div className="ai-suggestions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="ai-suggestion-btn"
                  onClick={() => {
                    setInput(t(lang, s));
                    inputRef.current?.focus();
                  }}
                >
                  {t(lang, s)}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={"ai-msg ai-msg--" + msg.role}>
            {msg.role === "assistant" && (
              <div className="ai-msg-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={BOT_ICON} />
                </svg>
              </div>
            )}
            <div className="ai-msg-bubble">
              {msg.content || (loading && i === messages.length - 1) ? (
                <p dangerouslySetInnerHTML={{ __html: renderHtml(msg.content) }} />
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

      <div className="ai-panel-sidebar-input">
        <div className="ai-panel-sidebar-input-wrap">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t(lang, "ai_placeholder")}
            rows={1}
            disabled={loading}
          />
          <button
            className="ai-panel-sidebar-send"
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
    </aside>
  );
};

export default AiPanel;
