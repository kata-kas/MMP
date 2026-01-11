import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useFormContext } from "../context";

export function Core() {
	const form = useFormContext();
	return (
		<fieldset className="space-y-4 rounded-lg border p-4">
			<legend className="px-2 text-sm font-medium">Core</legend>
			<div className="space-y-2">
				<Label htmlFor="core.log.path">Log Path</Label>
				<Input id="core.log.path" {...form.register("core.log.path")} />
			</div>
			<div className="flex items-center space-x-2">
				<Switch
					id="core.log.enable_file"
					checked={form.watch("core.log.enable_file")}
					onCheckedChange={(checked) =>
						form.setValue("core.log.enable_file", checked)
					}
				/>
				<Label htmlFor="core.log.enable_file">Log Enable File</Label>
			</div>
		</fieldset>
	);
}
