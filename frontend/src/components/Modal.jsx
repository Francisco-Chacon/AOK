// src/components/Modal.jsx
import React from "react";

const Modal = ({ open, title, children, onClose }) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <header className="modal-header">
          <h2>{title}</h2>
          <button className="btn-icon" onClick={onClose}>
            ✕
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
