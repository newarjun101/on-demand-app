import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './UI';
interface State { hasError: boolean; error?: Error; }
interface Props { children: ReactNode; }
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[ErrorBoundary]', error, info); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-lg w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 inline-flex items-center justify-center mb-4">
            <AlertTriangle size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
          {this.state.error && (
            <pre className="mt-4 text-left bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-700 overflow-x-auto max-h-40">
              {this.state.error.name}: {this.state.error.message}
            </pre>
          )}
          <Button variant="primary" className="mt-5" onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}>
            <RefreshCw size={14} className="mr-1" /> Reload
          </Button>
        </div>
      </div>
    );
  }
}
