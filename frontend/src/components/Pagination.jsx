import React from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";

const Pagination = ({ page, totalPages, total, limit, onPageChange }) => {
  const { lang } = useLanguage();
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const getPages = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-[var(--record-border)] bg-[var(--bg-panel)] px-4 py-3">
      <span className="text-sm text-[var(--text-muted)]">
        {from}–{to} {t(lang, "de")} {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] disabled:opacity-30"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          title={t(lang, "primera_pagina")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" />
          </svg>
        </button>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] disabled:opacity-30"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          title={t(lang, "anterior")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        {getPages().map((p) => (
          <button
            key={p}
            className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-sm font-semibold transition ${
              p === page
                ? "bg-[rgb(var(--primary))] text-white shadow-sm"
                : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]"
            }`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] disabled:opacity-30"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          title={t(lang, "siguiente")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] disabled:opacity-30"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          title={t(lang, "ultima_pagina")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
