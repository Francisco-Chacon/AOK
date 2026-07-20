import React from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";

const StatusBar = ({ aiConnected }) => {
  const { lang } = useLanguage();

  return (
    <footer className="statusbar flex h-8 shrink-0 items-center justify-between border-t border-[var(--border-subtle)] bg-[var(--statusbar-bg)] px-4 text-xs text-[var(--text-muted)] backdrop-blur">
      <div className="statusbar-left flex items-center gap-4">
        <div className="statusbar-item flex items-center gap-1.5">
          <span className="statusbar-dot statusbar-dot--success h-2 w-2 rounded-full bg-[rgb(var(--success))]" />
          <span>{t(lang, "local_ready")}</span>
        </div>
        <div className="statusbar-item flex items-center gap-1.5">
          <span>{t(lang, "guardar")}</span>
        </div>
      </div>
      <div className="statusbar-right flex items-center gap-4">
        <div className="statusbar-item flex items-center gap-1.5">
          <span className={"statusbar-dot h-2 w-2 rounded-full " + (aiConnected ? "statusbar-dot--success bg-[rgb(var(--success))]" : "statusbar-dot--muted bg-[var(--text-muted)]")} />
          <span>{t(lang, "ai_title")}: {aiConnected ? t(lang, "ai_online") : t(lang, "ai_offline")}</span>
        </div>
        <div className="statusbar-item flex items-center gap-1.5">
          <span>{t(lang, "version")}</span>
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;
