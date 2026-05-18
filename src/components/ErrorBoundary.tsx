import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-tn-bg flex items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md bg-white p-10 rounded-[32px] shadow-2xl border border-tn-border">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h1 className="text-2xl font-black text-tn-navy mb-4 uppercase tracking-tight">Ops! Algo deu errado</h1>
            <p className="text-tn-text-muted mb-8 text-[13px] leading-relaxed">
              Ocorreu um erro inesperado no sistema. Isso pode ser instabilidade na conexão ou na API de inteligência.
            </p>
            <div className="bg-red-50 p-4 rounded-xl mb-8 text-left border border-red-100 overflow-auto max-h-40">
              <p className="text-[10px] font-mono text-red-800 break-all">
                {this.state.error?.name}: {this.state.error?.message}
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-tn-blue text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
            >
              Recarregar Sistema
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
