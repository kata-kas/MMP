import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormContext } from "../context";

export function Integrations() {
    const form = useFormContext();
    return (
        <fieldset className="space-y-4 rounded-lg border p-4">
            <legend className="px-2 text-sm font-medium">Thingiverse</legend>
            <div className="space-y-2">
                <Label htmlFor="integrations.thingiverse.token">Token</Label>
                <Input
                    id="integrations.thingiverse.token"
                    {...form.register("integrations.thingiverse.token")}
                />
            </div>
        </fieldset>
    )
}
