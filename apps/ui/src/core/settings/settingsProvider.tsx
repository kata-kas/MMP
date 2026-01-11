import useAxios from "axios-hooks";
import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { logger } from "@/lib/logger";
import {
	type ExperimentalFeatures,
	type Settings,
	SettingsContext,
} from "../settings/settingsContext";

export function SettingsProvider({
	loading,
	children,
}: React.PropsWithChildren<{ loading: React.ReactNode }>) {
	const [settings, setSettings] = useState<Settings>({
		localBackend: "",
		experimental: { dashboard: false },
	} as Settings);
	const [, getSettings] = useAxios<Settings>(`/settings.json`, {
		manual: true,
	});
	const [, getAgentSettings] = useAxios({}, { manual: true });
	const [ready, setReady] = useState(false);
	const hasInitialized = useRef(false);

	const [experimental, setExperimental] = useLocalStorage<ExperimentalFeatures>(
		"experimental",
		{
			dashboard: false,
		},
	);

	useEffect(() => {
		setSettings((prev) => ({ ...prev, experimental }));
	}, [experimental]);

	useEffect(() => {
		if (hasInitialized.current) return;
		hasInitialized.current = true;

		let isMounted = true;

		const timeoutId = setTimeout(() => {
			if (isMounted) {
				logger.error("Settings loading timeout - using default");
				setSettings((prev) => ({ ...prev, localBackend: "/api" }));
				setReady(true);
			}
		}, 5000);

		getSettings()
			.then(({ data: s }) => {
				if (!isMounted) {
					setReady(true);
					return;
				}
				clearTimeout(timeoutId);
				if (!s?.localBackend) {
					logger.error(
						"Settings loaded but localBackend is missing - using default",
					);
					setSettings((prev) => ({ ...prev, localBackend: "/api" }));
					setReady(true);
					return;
				}
				setSettings((prev) => ({ ...prev, ...s }));
				getAgentSettings({ url: `${s.localBackend}/system/settings` })
					.then(({ data: agent }) => {
						if (isMounted) {
							setSettings((prev) => ({
								...prev,
								agent: agent as Record<string, unknown>,
							}));
						}
						setReady(true);
					})
					.catch((e) => {
						const error = e as { name?: string; code?: string };
						if (
							isMounted &&
							error.name !== "CanceledError" &&
							error.code !== "ERR_CANCELED"
						) {
							logger.error("Failed to load agent settings:", e);
						}
						setReady(true);
					});
			})
			.catch((e) => {
				clearTimeout(timeoutId);
				const error = e as { name?: string; code?: string };
				if (
					isMounted &&
					error.name !== "CanceledError" &&
					error.code !== "ERR_CANCELED"
				) {
					logger.error("Failed to load settings - using default", e);
				}
				if (isMounted) {
					setSettings((prev) => ({ ...prev, localBackend: "/api" }));
				}
				setReady(true);
			});

		return () => {
			isMounted = false;
			clearTimeout(timeoutId);
		};
	}, [getSettings, getAgentSettings]);

	return (
		<SettingsContext.Provider value={{ settings, setExperimental, ready }}>
			{ready ? children : loading}
		</SettingsContext.Provider>
	);
}
