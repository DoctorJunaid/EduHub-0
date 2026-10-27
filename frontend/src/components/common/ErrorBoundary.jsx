import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === "function"
          ? this.props.fallback(this.state.error, this.handleReset)
          : this.props.fallback;
      }

      return (
        <div className="p-6 rounded-xl border border-rose-200 bg-rose-50/70 text-slate-800 text-center flex flex-col items-center justify-center gap-3 my-4">
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-rose-900">
              {this.props.title || "Something went wrong"}
            </h3>
            <p className="text-xs text-rose-700 mt-1 max-w-md">
              {this.state.error?.message || "An unexpected error occurred in this section."}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={this.handleReset}
            className="border-rose-300 text-rose-800 bg-white hover:bg-rose-100 text-xs"
          >
            <RefreshCw size={13} className="mr-1.5" /> Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
