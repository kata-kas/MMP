import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TagsInput } from "@/components/ui/tags-input";
import { useFormContext } from "../context";

export function Library() {
    const form = useFormContext();
    return (
        <fieldset className="space-y-4 rounded-lg border p-4">
            <legend className="px-2 text-sm font-medium">Library</legend>
            <div className="space-y-2">
                <Label htmlFor="library.path">Path</Label>
                <Input
                    id="library.path"
                    {...form.register("library.path")}
                />
            </div>
            <TagsInput
                label="Blacklist"
                value={form.watch("library.blacklist") || []}
                onChange={(value) => form.setValue("library.blacklist", value)}
                splitChars={[' ', '|']}
            />
            <div className="flex items-center space-x-2">
                <Switch
                    id="library.ignore_dot_files"
                    checked={form.watch("library.ignore_dot_files")}
                    onCheckedChange={(checked) => form.setValue("library.ignore_dot_files", checked)}
                />
                <Label htmlFor="library.ignore_dot_files">Ignore dot Files</Label>
            </div>
        </fieldset>
    )
}
