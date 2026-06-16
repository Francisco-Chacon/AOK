import React from "react";

const EmptyState = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--record-border)] bg-[var(--bg-card)] px-6 py-10 text-center text-[var(--text-main)]">
      {icon && <div className="text-4xl text-[var(--text-muted)]">{icon}</div>}
      {title && <p className="text-base font-bold">{title}</p>}
      {description && <p className="max-w-md text-sm text-[var(--text-muted)]">{description}</p>}
      {action && action}
    </div>
  );
};

export default EmptyState;
