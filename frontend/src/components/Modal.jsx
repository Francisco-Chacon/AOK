import React from "react";
import { cn } from "../utils/cn";

const X_ICON = "M18 6 6 18 M6 6l12 12";

const Modal = ({ open, title, children, onClose, wide, fullscreen }) => {
  if (!open) return null;

  return (
    <div className={cn("modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] p-4", fullscreen && "modal-backdrop--fullscreen p-0")}>
      <div
        className={cn(
          "modal max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--record-border)] bg-[var(--bg-modal)] text-[var(--text-main)] shadow-2xl backdrop-blur",
          wide && "modal--wide max-w-5xl",
          fullscreen && "modal--fullscreen h-screen max-h-screen max-w-none rounded-none border-0"
        )}
      >
        {title && (
          <header className="modal-header flex items-center justify-between gap-4 border-b border-[var(--record-border)] px-5 py-4">
            <h2 className="text-lg font-bold">{title}</h2>
            <button className="btn-icon inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]" onClick={onClose}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={X_ICON} />
              </svg>
            </button>
          </header>
        )}
        <div className={cn("modal-body max-h-[calc(90vh-80px)] overflow-y-auto p-5", fullscreen && "max-h-[calc(100vh-64px)]")}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
