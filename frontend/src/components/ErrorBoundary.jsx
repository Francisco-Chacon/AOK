import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-body)] p-6">
          <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-[var(--record-border)] bg-[var(--bg-card)] p-8 text-center shadow-2xl">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-danger)]">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01" />
            </svg>
            <h2 className="text-xl font-bold text-[var(--text-main)]">Algo sali\u00f3 mal</h2>
            <p className="text-sm text-[var(--text-muted)]">Ha ocurrido un error inesperado en la aplicaci\u00f3n.</p>
            <pre className="w-full rounded-lg bg-[var(--muted)] p-3 text-left text-xs text-[var(--text-muted)]">
              {this.state.error?.message || "Error desconocido"}
            </pre>
            <button className="btn-primary" onClick={this.handleReload}>
              Recargar p\u00e1gina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
