import React from "react";
import { RefreshCw, Home, AlertCircle } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error("[Framoji ErrorBoundary caught error]:", error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} className="aurora-bg">
          <div className="card" style={{ maxWidth: 420, width: "100%", padding: 32, textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#F87171" }}>
              <AlertCircle size={24} />
            </div>
            <h2 className="display" style={{ fontSize: 24, color: "var(--cream)", marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ color: "var(--text-sub)", fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
              An unexpected error occurred in the booth session. You can reload or head back to the home page to create a new session.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={this.handleReload} className="btn btn-primary" style={{ padding: "10px 22px", fontSize: 13, borderRadius: 10 }}>
                <RefreshCw size={13} /> Reload page
              </button>
              <button onClick={this.handleHome} className="btn btn-ghost" style={{ padding: "10px 18px", fontSize: 13, borderRadius: 10 }}>
                <Home size={13} /> Return home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
