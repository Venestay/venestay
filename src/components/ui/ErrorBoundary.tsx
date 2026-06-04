import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public declare props: Props;
  public declare state: State;
  public declare setState: (
    state: Partial<State> | ((prevState: Readonly<State>, props: Readonly<Props>) => Partial<State> | null),
    callback?: () => void
  ) => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
    this.handleReset = this.handleReset.bind(this);
    this.handleReload = this.handleReload.bind(this);
  }

  public static getDerivedStateFromError(error: Error): State {
    const errorMsg = error.message || '';
    const errorName = error.name || '';
    
    const isChunkError = 
      errorMsg.includes('Failed to fetch dynamically imported module') ||
      errorName === 'ChunkLoadError' ||
      errorMsg.includes('ChunkLoadError') ||
      errorMsg.includes('Failed to load module script') ||
      errorMsg.includes('Expected a JavaScript-or-Wasm module script');
      
    if (isChunkError) {
      try {
        const lastReload = sessionStorage.getItem('last_chunk_error_reload');
        const now = Date.now();
        if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
          sessionStorage.setItem('last_chunk_error_reload', now.toString());
          window.location.href = window.location.pathname + '?t=' + now;
        }
      } catch (e) {
        console.error('Failed to auto-reload on chunk error:', e);
      }
    }

    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('CRITICAL UI ERROR:', error, errorInfo);
  }

  private handleReset() {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  }

  private handleReload() {
    window.location.href = window.location.pathname + '?t=' + Date.now();
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B1120] p-6 text-center text-white">
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-red-500/10 shadow-2xl shadow-red-500/20">
            <ShieldAlert className="h-12 w-12 text-red-500" />
          </div>
          
          <h1 className="mb-4 text-3xl font-black tracking-tight uppercase">
            Protección Activa VeneStay
          </h1>
          
          <p className="mb-12 max-w-md text-sm font-medium text-gray-400 leading-relaxed">
            Hemos detectado una anomalía técnica en este componente. 
            No te preocupes, tu sesión y datos están protegidos.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              onClick={this.handleReload}
              className="flex items-center justify-center gap-3 rounded-2xl bg-white px-8 py-4 text-xs font-black tracking-widest text-[#0B1120] uppercase transition-transform active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              Recargar Aplicación
            </button>
            
            <button
              onClick={this.handleReset}
              className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-xs font-black tracking-widest text-white uppercase transition-colors hover:bg-white/10"
            >
              <Home className="h-4 w-4" />
              Volver al Inicio
            </button>
          </div>

          <div className="mt-16 rounded-2xl border border-white/5 bg-black/20 p-4 font-mono text-[10px] text-gray-600">
            ID de Error: {this.state.error?.name || 'Unknown'} | {new Date().toLocaleTimeString()}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


