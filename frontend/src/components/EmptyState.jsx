import React from "react";

const EmptyIcon = ({ svg }) => {
  if (!svg) return null;
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-hover)] text-[var(--text-muted)]">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={svg} />
      </svg>
    </div>
  );
};

const EmptyState = ({ icon, svg, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--record-border)] bg-[var(--bg-card)] px-6 py-10 text-center text-[var(--text-main)]">
      {svg && <EmptyIcon svg={svg} />}
      {icon && !svg && <div className="text-4xl text-[var(--text-muted)]">{icon}</div>}
      {title && <p className="text-base font-bold">{title}</p>}
      {description && <p className="max-w-md text-sm text-[var(--text-muted)]">{description}</p>}
      {action && action}
    </div>
  );
};

export default EmptyState;
