import { ConfirmDialog } from "@/core/dialogs/confirm-dialog/ConfirmDialog";
import { SettingsContext } from "@/core/settings/settingsContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useAxios from "axios-hooks";
import { useContext, useState, useCallback } from "react";
import { logger } from "@/lib/logger";

export function ServerOperations() {
    const { settings } = useContext(SettingsContext);
    const [isOpen, setIsOpen] = useState(false);
    const [{ loading }, doDiscovery] = useAxios(
        {
            url: `${settings.localBackend}/system/discovery`
        }, { manual: true })

    const onOk = useCallback(() => {
        setIsOpen(false);
        doDiscovery()
            .then(() => {
                toast.success('Great Success!', {
                    description: 'Global discovery started',
                })
            })
            .catch((e) => {
                logger.error(e)
            });
    }, [doDiscovery])
    return (
        <fieldset className="space-y-4 rounded-lg border p-4">
            <legend className="px-2 text-sm font-medium">Discovery</legend>
            <Button onClick={() => setIsOpen(true)} disabled={loading}>Run discovery</Button>
            <ConfirmDialog opened={isOpen} onOk={onOk} onCancel={() => setIsOpen(false)} />
        </fieldset>
    )
}
