import { ConfirmDialog } from "@/core/dialogs/confirm-dialog/ConfirmDialog";
import { SettingsContext } from "@/core/settings/settingsContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useAxios from "axios-hooks";
import { useCallback, useContext, useState } from "react";
import { logger } from "@/lib/logger";

interface DiscoverBtnProps {
    projectUuid: string;
}

export function DiscoverBtn({ projectUuid }: DiscoverBtnProps) {
    const { settings } = useContext(SettingsContext);
    const [isOpen, setIsOpen] = useState(false);
    const [{ loading }, doDiscovery] = useAxios(
        {
            url: `${settings.localBackend}/projects/${projectUuid}/discover`
        }, { manual: true })

    const onOk = useCallback(() => {
        setIsOpen(false);
        doDiscovery()
            .then(() => {
                toast.success('Great Success!', {
                    description: 'Project discovery started',
                })
            })
            .catch((e) => {
                logger.error(e)
            });
    }, [doDiscovery])

    return (<>
        <Button onClick={() => setIsOpen(true)} disabled={loading}>
            {loading ? "Starting..." : "Run discovery"}
        </Button>
        <ConfirmDialog opened={isOpen} onOk={onOk} onCancel={() => setIsOpen(false)} />
    </>
    )
}
