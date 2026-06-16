// frontend/src/components/Spinner.jsx
import React from "react";

const Spinner = ({ size = "medium", color = "var(--accent-strong)" }) => {
  const sizes = {
    small: "h-5 w-5",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };

  return (
    <div
      className={(sizes[size] || sizes.medium) + " inline-block animate-spin rounded-full border-[3px] border-[var(--border-subtle)]"}
      style={{
        borderTopColor: color,
      }}
    />
  );
};

export const LoadingOverlay = ({ loading, children }) => {
  if (!loading) return children;
  
  return (
    <div className="relative">
      <div
        className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-[var(--bg-panel)]"
      >
        <Spinner />
      </div>
      {children}
    </div>
  );
};

export default Spinner;
