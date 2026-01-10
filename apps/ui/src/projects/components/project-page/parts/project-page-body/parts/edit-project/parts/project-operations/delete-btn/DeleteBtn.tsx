import { ConfirmDialog } from "@/core/dialogs/confirm-dialog/ConfirmDialog";
import { SettingsContext } from "@/core/settings/settingsContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useAxios from "axios-hooks";
import { useCallback, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logger } from "@/lib/logger";

interface DeleteBtnProps {
    projectUuid: string;
}

export function DeleteBtn({ projectUuid }: DeleteBtnProps) {
    const navigate = useNavigate();
    const { settings } = useContext(SettingsContext);
    const [isOpen, setIsOpen] = useState(false);
    const [{ loading }, doDelete] = useAxios(
        {
            url: `${settings.localBackend}/projects/${projectUuid}/delete`,
            method: 'post',
        }, { manual: true })

    const onOk = useCallback(() => {
        setIsOpen(false);
        doDelete()
            .then(() => {
                toast.success('Great Success!', {
                    description: 'Project deleted',
                })
                navigate(`/projects?tab=list`)
            })
            .catch((e) => {
                logger.error(e)
            });
    }, [doDelete, navigate])

    return (<>
        <Button variant="destructive" onClick={() => setIsOpen(true)} disabled={loading}>
            {loading ? "Deleting..." : "Delete Project"}
        </Button>
        <ConfirmDialog opened={isOpen} onOk={onOk} onCancel={() => setIsOpen(false)} />
    </>
    )
}
