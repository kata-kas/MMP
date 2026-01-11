import type { ReactNode } from "react";
import { SettingsProvider } from "@/core/settings/settingsProvider";
import { SSEProvider } from "@/core/sse/SSEProvider";
import { DashboardProvider } from "@/dashboard/provider/DashboardProvider";

export function MockProviders({ children }: { children: ReactNode }) {
	return (
		<SettingsProvider loading={<div>Loading settings...</div>}>
			<SSEProvider>
				<DashboardProvider>{children}</DashboardProvider>
			</SSEProvider>
		</SettingsProvider>
	);
}
