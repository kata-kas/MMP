import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormContext } from "../context";

export function Server() {
	const form = useFormContext();
	return (
		<fieldset className="space-y-4 rounded-lg border p-4">
			<legend className="px-2 text-sm font-medium">Server</legend>
			<div className="space-y-2">
				<Label htmlFor="server.port">Port</Label>
				<Input
					id="server.port"
					type="number"
					{...form.register("server.port", { valueAsNumber: true })}
				/>
			</div>
		</fieldset>
	);
}
