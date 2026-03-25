import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#040810', color: '#fff', fontFamily: 'system-ui', padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>⚖️</p>
          <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Nyaya failed to load</h1>
          <p style={{ fontSize: '14px', color: '#999', marginBottom: '24px', maxWidth: '400px' }}>{this.state.error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ background: '#c9a227', color: '#0d1f35', padding: '14px 32px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '15px' }}
          >
            Reload Nyaya
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
