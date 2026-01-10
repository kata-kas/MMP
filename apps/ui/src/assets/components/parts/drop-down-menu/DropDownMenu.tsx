import { SettingsContext } from "@/core/settings/settingsContext";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { IconDotsVertical, IconDownload, IconTrash } from "@tabler/icons-react";
import useAxios from "axios-hooks";
import { useContext } from "react";
import { logger } from "@/lib/logger";

type DropDownMenuProps = {
    id: string;
    projectUuid: string;
    children?: React.ReactNode;
    downloadURL?: string
    onDelete?: () => void;
    openDetails?: () => void;
    toggleLoad?: () => void;
}

export function DropDownMenu({ id, projectUuid, children, downloadURL, onDelete, openDetails, toggleLoad }: DropDownMenuProps) {
    const { settings } = useContext(SettingsContext);
    const [, callDelete] = useAxios(
        {
            url: `${settings.localBackend}/projects/${projectUuid}/assets/${id}/delete`,
            method: 'POST'
        },
        { manual: true }
    );

    const handleDelete = () => {
        toggleLoad && toggleLoad();
        callDelete()
            .then(() => {
                onDelete && onDelete();
            }).catch((e) => {
                logger.error(e);
            })
            .finally(() => {
                toggleLoad && toggleLoad();
            })
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <IconDotsVertical className="h-5 w-5" stroke={1.5} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {children}
                {openDetails && (
                    <DropdownMenuItem onClick={openDetails}>
                        <IconDownload className="mr-2 h-3.5 w-3.5" />
                        Details
                    </DropdownMenuItem>
                )}
                {downloadURL && (
                    <DropdownMenuItem asChild>
                        <a href={downloadURL}>
                            <IconDownload className="mr-2 h-3.5 w-3.5" />
                            Download
                        </a>
                    </DropdownMenuItem>
                )}
                {onDelete && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive"
                            onClick={handleDelete}
                        >
                            <IconTrash className="mr-2 h-3.5 w-3.5" />
                            Delete
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
