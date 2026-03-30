import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error("[ErrorBoundary] Uncaught error:", error);
		console.error("[ErrorBoundary] Component stack:", info.componentStack);
	}

	handleReset = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="flex h-full flex-col items-center justify-center gap-6 bg-surface p-8">
					<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
						<span className="text-3xl">!</span>
					</div>
					<div className="max-w-md text-center">
						<h1 className="mb-2 text-xl font-semibold text-text-primary">
							Something went wrong
						</h1>
						<p className="mb-4 text-sm text-text-secondary">
							{this.state.error?.message || "An unexpected error occurred."}
						</p>
					</div>
					<div className="flex gap-3">
						<button
							type="button"
							onClick={this.handleReset}
							className="rounded-lg bg-craft-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-craft-700"
						>
							Try Again
						</button>
						<a
							href="/"
							className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-tertiary"
						>
							Go Home
						</a>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
