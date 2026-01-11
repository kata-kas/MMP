import { useContext } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	type ExperimentalFeatures,
	SettingsContext,
} from "@/core/settings/settingsContext";

export function Experimental() {
	const { settings, setExperimental } = useContext(SettingsContext);

	return (
		<div className="container mx-auto max-w-4xl">
			<fieldset className="space-y-4 rounded-lg border p-4">
				<legend className="px-2 text-sm font-medium">Experimental</legend>
				<div className="flex items-center space-x-2">
					<Switch
						id="dashboard"
						checked={settings.experimental.dashboard}
						onCheckedChange={(checked) =>
							setExperimental((prev: ExperimentalFeatures) => ({
								...prev,
								dashboard: checked,
							}))
						}
					/>
					<Label htmlFor="dashboard">Dashboard</Label>
				</div>
			</fieldset>
		</div>
	);
}
