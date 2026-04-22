import React, { useState, useRef, useEffect } from "react";

const SearchableSelect = ({ value, onChange, options, placeholder = "Seleccione...", debounceMs = 250 }) => {
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
    <div className="searchable-select">
      <div className="searchable-select-input-wrap">
        <input
          ref={inputRef}
          className="input searchable-select-input"
          type="text"
          value={search}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          placeholder={selected?.label || placeholder}
          autoComplete="off"
        />
        <input type="hidden" name="cliente_id" value={value} />
        <button
          type="button"
          className="searchable-select-arrow"
          onClick={() => { inputRef.current?.focus(); setOpen((p) => !p); }}
          tabIndex={-1}
        >
          ▼
        </button>
      </div>
      {open && (
        <ul className="searchable-select-list">
          {filtered.length === 0 ? (
            <li className="searchable-select-empty">Sin resultados</li>
          ) : (
            filtered.map((o) => (
              <li
                key={o.value}
                className={"searchable-select-option" + (o.value === value ? " selected" : "")}
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