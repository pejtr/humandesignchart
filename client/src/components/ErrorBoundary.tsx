import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[50vh] p-8">
          <div className="flex flex-col items-center w-full max-w-lg p-8">
            <AlertTriangle
              size={40}
              className="text-destructive mb-4 flex-shrink-0"
            />
            <h2 className="text-lg font-semibold mb-2">Došlo k neočekávané chybě</h2>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Tato část aplikace selhala. Zkuste stránku obnovit.
            </p>
            <div className="p-3 w-full rounded bg-muted overflow-auto mb-4 max-h-32">
              <pre className="text-xs text-muted-foreground whitespace-break-spaces">
                {this.state.error?.message}
              </pre>
            </div>
            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={14} />
              Obnovit stránku
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
