import React from "react";
import { t } from "../i18n/translations";

const SUN_ICON = "M12 4V2 M12 22v-2 M4.93 4.93 3.51 3.51 M20.49 20.49l-1.42-1.42 M4 12H2 M22 12h-2 M4.93 19.07l-1.42 1.42 M20.49 3.51l-1.42 1.42 M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8";
const MOON_ICON = "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79";
const LANG_ICON = "M3 5h12 M9 3v2 M10 5c-.7 4.2-3.1 7.2-7 9 M5 9c1.4 2.4 3.6 4.2 6 5 M14 21l4-9 4 9 M15.5 18h5";

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const Topbar = ({ darkMode, onToggleTheme, lang, onToggleLang, online, onOpenAi }) => {
  return (
    <header className="topbar flex h-12 shrink-0 items-center justify-end gap-3 border-b border-[var(--border-subtle)] bg-[var(--topbar-bg)] px-5 backdrop-blur">
      <div className="topbar-right flex shrink-0 items-center gap-2">
        <div
          className={"topbar-status flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:bg-[var(--bg-hover)] " + (online ? "topbar-status--online border-[rgba(var(--success),0.35)] text-[rgb(var(--success))]" : "topbar-status--offline border-[rgba(var(--destructive),0.35)] text-[rgb(var(--destructive))]")}
          onClick={onOpenAi}
          role="button"
          tabIndex={0}
        >
          <span className={"topbar-status-dot h-2 w-2 rounded-full " + (online ? "bg-[rgb(var(--success))]" : "bg-[rgb(var(--destructive))]")} />
          <span>{online ? t(lang, "ai_online") : t(lang, "ai_offline")}</span>
        </div>

        <button className="topbar-btn inline-flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]" onClick={onToggleLang} title={lang === "es" ? "English" : "Español"}>
          <Icon d={LANG_ICON} />
        </button>

        <button className="topbar-btn inline-flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]" onClick={onToggleTheme} title={darkMode ? t(lang, "light") : t(lang, "dark")}>
          <Icon d={darkMode ? SUN_ICON : MOON_ICON} />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
