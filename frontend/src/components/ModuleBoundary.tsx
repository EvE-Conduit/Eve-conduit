import { AlertTriangle } from "lucide-react";
import { Component, type ReactNode } from "react";

/** Keeps a crashing module from taking the rest of the page down with it. */
export class ModuleBoundary extends Component<{ name: string; children: ReactNode; compact?: boolean }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(`Module "${this.props.name}" crashed`, error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className={`flex items-start gap-3 rounded-xl border border-warning/25 bg-warning/5 text-sm ${this.props.compact ? "p-4" : "p-6"}`}>
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
        <div>
          <div className="font-medium text-warning-fg">{this.props.name} ran into a problem</div>
          <div className="mt-0.5 text-muted">{this.state.error.message}</div>
        </div>
      </div>
    );
  }
}
