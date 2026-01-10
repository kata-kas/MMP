import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import useAxios from "axios-hooks";
import { useContext } from "react";
import { SettingsContext } from "@/core/settings/settingsContext";
import { cn } from "@/lib/utils";

export function ImportProject() {
    const { settings } = useContext(SettingsContext);
    const [{ loading, error }, fetchProject] = useAxios({
        url: `${settings.localBackend}/downloader/fetch`,
        method: 'post',
    }, { manual: true })
    
    const form = useForm({
        defaultValues: {
            urls: '',
        },
    });
    
    const onFetch = (data: { urls: string }) => {
        const urls = data.urls.split('\n');
        fetchProject({
            data: {
                url: urls.join(',')
            }
        }).then(({ data }) => {
            console.log(data);
        })
    }
    
    return (
        <div className="container mx-auto max-w-4xl">
            <h1 className="mb-4 text-2xl font-bold">Import Project</h1>
            <form onSubmit={form.handleSubmit(onFetch)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="urls">Thingiverse urls</Label>
                    <Textarea
                        id="urls"
                        placeholder={'https://www.thingiverse.com/thing:2631794\nthing:4739346'}
                        {...form.register("urls", { required: true, minLength: 2 })}
                    />
                    {form.formState.errors.urls && (
                        <p className="text-sm text-destructive">Too short name</p>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">
                    Check out <a href="https://github.com/Maker-Management-Platform/mmp-companion" className="text-primary underline">MMP Companion</a> to import from more platforms.
                </p>
                <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                        {loading ? "Submitting..." : "Submit"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
