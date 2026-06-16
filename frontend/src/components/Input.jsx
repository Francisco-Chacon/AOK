import React from "react";
import { cn } from "../utils/cn";

const Input = ({
  label,
  error,
  helperText,
  className = "",
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-[var(--text-muted)]" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "min-h-10 rounded-xl border border-[var(--record-border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-main)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-[rgba(var(--primary),0.18)]",
          error && "border-[rgb(var(--destructive))] focus:border-[rgb(var(--destructive))]",
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-[rgb(var(--destructive))]">{error}</span>}
      {helperText && !error && <span className="text-xs text-[var(--text-muted)]">{helperText}</span>}
    </div>
  );
};

export default Input;
