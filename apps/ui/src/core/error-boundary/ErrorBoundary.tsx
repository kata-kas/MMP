import React from "react";
import { ErrorFallback } from "./ErrorFallback";

interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
	onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		if (this.props.onError) {
			this.props.onError(error, errorInfo);
		} else {
			if (import.meta.env.DEV) {
				console.error("Error caught by boundary:", error, errorInfo);
			}
		}
	}

	reset = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError && this.state.error) {
			const Fallback = this.props.fallback || ErrorFallback;
			return <Fallback error={this.state.error} reset={this.reset} />;
		}

		return this.props.children;
	}
}
