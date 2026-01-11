import useAxios from "axios-hooks";
import { useContext, useEffect, useRef } from "react";
import { SettingsContext } from "@/core/settings/settingsContext";
import { Button } from "@/components/ui/button";
import { FormProvider, useForm } from "./context";
import { Core } from "./parts/Core";
import { Library } from "./parts/Library";
import { Server } from "./parts/Server";
import { Render } from "./parts/Render";
import { Integrations } from "./parts/Integrations";
import { AgentSettings } from "@/settings/entities/AgentSettings";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export function SettingsForm() {
    const reload = useRef(Math.floor(1000 + Math.random() * 9000));
    const { settings } = useContext(SettingsContext);
    const [{ data, loading: cLoading }] = useAxios<AgentSettings>(
        settings.localBackend 
            ? { url: `${settings.localBackend}/system/settings?_=${reload.current}` }
            : null,
        { skip: !settings.localBackend }
    )

    const [{ loading: sLoading }, executeSave] = useAxios({
        url: settings.localBackend ? `${settings.localBackend}/system/settings` : '',
        method: 'POST'
    }, { manual: true })

    const form = useForm<AgentSettings>({
        defaultValues: {
            "core": {
                "log": {
                    "enable_file": false,
                    "path": ""
                }
            },
            "server": {
                "port": 0
            },
            "library": {
                "path": "",
                "blacklist": [],
                "ignore_dot_files": false
            },
            "render": {
                "max_workers": 0,
                "model_color": "",
                "background_color": ""
            },
            "integrations": {
                "thingiverse": {
                    "token": ""
                }
            }
        }
    });

    useEffect(() => {
        if (data) {
            form.reset(data);
        }
    }, [data, form])

    const onSave = (formData: AgentSettings) => {
        executeSave({
            data: formData
        })
            .then(() => {
                toast.success('Great Success!', {
                    description: 'Settings updated',
                })
            })
            .catch((e) => {
                logger.error(e)
            });
    };

    return (
        <div className="container mx-auto max-w-4xl">
            <FormProvider form={form}>
                <form onSubmit={form.handleSubmit(onSave)}>
                    <Server />
                    <Core />
                    <Library />
                    <Render />
                    <Integrations />
                    <fieldset className="mt-6 space-y-4 rounded-lg border p-4">
                        <legend className="px-2 text-sm font-medium">Commit</legend>
                        <div className="flex justify-end gap-2">
                            <Button type="submit" disabled={sLoading || cLoading} variant="destructive">Save</Button>
                            <Button type="button" variant="outline" onClick={() => form.reset()}>Reset</Button>
                        </div>
                    </fieldset>
                </form>
            </FormProvider>
        </div>
    )
}
