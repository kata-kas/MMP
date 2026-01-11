import { useContext } from "react";
import { SettingsContext } from "./settingsContext";

export function useSettings() {
	const { settings, setExperimental, ready } = useContext(SettingsContext);

	if (!ready || !settings?.localBackend) {
		throw new Error(
			"Settings not ready. Ensure SettingsProvider has loaded settings before using useSettings.",
		);
	}

	return { settings, setExperimental };
}
