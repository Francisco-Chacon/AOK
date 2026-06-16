import React from "react";

const SEARCH_ICON = "M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16";

const SearchBar = ({ value, onChange, placeholder }) => {
  return (
    <div className="search-bar-wrap relative w-full max-w-sm">
      <svg className="search-bar-icon absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={SEARCH_ICON} />
      </svg>
      <input
        className="input search-bar w-full rounded-xl border border-[var(--record-border)] bg-[var(--bg-input)] py-2 pl-10 pr-3 text-sm text-[var(--text-main)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-[rgba(var(--primary),0.16)]"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export default SearchBar;
