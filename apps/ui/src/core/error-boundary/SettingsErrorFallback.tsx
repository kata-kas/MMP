import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface SettingsErrorFallbackProps {
	error: Error;
	reset: () => void;
}

export function SettingsErrorFallback({
	error,
	reset,
}: SettingsErrorFallbackProps) {
	// Error is available for logging/telemetry but not displayed to user
	void error;
	return (
		<div className="flex items-center justify-center min-h-screen p-4">
			<Alert className="max-w-md">
				<AlertCircle className="h-4 w-4" />
				<AlertTitle>Settings Unavailable</AlertTitle>
				<AlertDescription className="mt-2">
					<p className="mb-4">
						Unable to load application settings. The app will continue with
						default settings.
					</p>
					<Button onClick={reset} variant="outline" size="sm">
						Retry
					</Button>
				</AlertDescription>
			</Alert>
		</div>
	);
}
