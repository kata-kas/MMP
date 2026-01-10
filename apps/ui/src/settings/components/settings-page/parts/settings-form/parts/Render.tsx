import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormContext } from "../context";

export function Render() {
    const form = useFormContext();
    return (
        <fieldset className="space-y-4 rounded-lg border p-4">
            <legend className="px-2 text-sm font-medium">Render</legend>
            <div className="space-y-2">
                <Label htmlFor="render.max_workers">Max workers</Label>
                <Input
                    id="render.max_workers"
                    type="number"
                    {...form.register("render.max_workers", { valueAsNumber: true })}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="render.model_color">Model color</Label>
                <Input
                    id="render.model_color"
                    type="color"
                    {...form.register("render.model_color")}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="render.background_color">Background color</Label>
                <Input
                    id="render.background_color"
                    type="color"
                    {...form.register("render.background_color")}
                />
            </div>
        </fieldset>
    )
}
