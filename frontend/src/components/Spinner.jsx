// frontend/src/components/Spinner.jsx
import React from "react";

const Spinner = ({ size = "medium", color = "var(--accent-strong)" }) => {
  const sizes = {
    small: "20px",
    medium: "32px",
    large: "48px",
  };

  const spinnerSize = sizes[size] || sizes.medium;

  return (
    <div
      style={{
        display: "inline-block",
        width: spinnerSize,
        height: spinnerSize,
        border: "3px solid rgba(0,0,0,0.1)",
        borderTopColor: color,
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
};

export const LoadingOverlay = ({ loading, children }) => {
  if (!loading) return children;
  
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(255,255,255,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          borderRadius: "inherit",
        }}
      >
        <Spinner />
      </div>
      {children}
    </div>
  );
};

export default Spinner;