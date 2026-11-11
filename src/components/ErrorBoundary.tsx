import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React render:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#060b14] text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4 text-2xl font-bold">
            !
          </div>
          <h2 className="text-lg font-bold mb-2">Ocurrió un error al cargar la vista</h2>
          <p className="text-xs text-slate-400 max-w-sm mb-6 font-mono break-words">
            {this.state.error?.message || 'Error inesperado'}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-5 py-2.5 bg-[#00e5ff] text-slate-950 font-bold text-xs rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            Reintentar y Recargar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
