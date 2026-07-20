import React, { useState, useRef, useEffect } from "react";
import { cn } from "../utils/cn";
import { useLanguage } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";

const SearchableSelect = ({ value, onChange, options, placeholder, debounceMs = 250 }) => {
  const { lang } = useLanguage();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, debounceMs);
    return () => clearTimeout(debounceRef.current);
  }, [search, debounceMs]);

  const filtered = options.filter(
    (o) =>
      !debouncedSearch ||
      o.label.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const selected = options.find((o) => o.value === value);

  const handleSelect = (optValue) => {
    onChange({ target: { name: "cliente_id", value: optValue } });
    setSearch("");
    setDebouncedSearch("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleInputChange = (e) => {
    const v = e.target.value;
    setSearch(v);
    if (v && !open) setOpen(true);
  };

  const handleBlur = () => {
    setTimeout(() => setOpen(false), 200);
  };

  return (
    <div className="searchable-select relative w-full">
      <div className="searchable-select-input-wrap relative">
        <input
          ref={inputRef}
          className="input searchable-select-input pr-10"
          type="text"
          value={search}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          placeholder={selected?.label || placeholder || t(lang, "seleccione")}
          autoComplete="off"
        />
        <input type="hidden" name="cliente_id" value={value} />
        <button
          type="button"
          className="searchable-select-arrow absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-xs text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]"
          onClick={() => { inputRef.current?.focus(); setOpen((p) => !p); }}
          tabIndex={-1}
          aria-label={t(lang, "abrir_lista")}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>
      {open && (
        <ul className="searchable-select-list absolute z-40 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-[var(--record-border)] bg-[var(--bg-modal)] p-1 shadow-xl backdrop-blur">
          {filtered.length === 0 ? (
            <li className="searchable-select-empty px-3 py-2 text-sm text-[var(--text-muted)]">{t(lang, "sin_resultados")}</li>
          ) : (
            filtered.map((o) => (
              <li
                key={o.value}
                className={cn(
                  "searchable-select-option cursor-pointer rounded-lg px-3 py-2 text-sm text-[var(--text-main)] transition hover:bg-[var(--bg-hover)]",
                  o.value === value && "selected bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                )}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(o.value); }}
              >
                {o.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchableSelect;
