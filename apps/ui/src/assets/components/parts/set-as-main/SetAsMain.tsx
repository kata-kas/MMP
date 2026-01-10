import { SettingsContext } from "@/core/settings/settingsContext";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import useAxios from "axios-hooks";
import { useCallback, useContext } from "react";

export type SetAsMainProps = {
    projectUuid: string;
    assetId?: string;
    onChange: () => void;
}

export function SetAsMain({ projectUuid, assetId, onChange }: SetAsMainProps) {
    const { settings } = useContext(SettingsContext);
    const [, callSetMainImage] = useAxios(
        {
            url: `${settings.localBackend}/projects/${projectUuid}/image`,
            method: 'POST'
        },
        { manual: true }
    );
    const setMainImage = useCallback(() => {
        callSetMainImage({
            data: {
                uuid: projectUuid,
                default_image_id: assetId
            }
        })
            .then(({ data }) => {
                console.log(data);
                toast.success('Great Success!', {
                    description: 'Project main image updated!',
                })
                onChange()
            })
            .catch((e) => {
                console.log(e)
            });
    }, [projectUuid, assetId, callSetMainImage, onChange]);

    if (!assetId) return null;

    return (
        <DropdownMenuItem onClick={setMainImage}>
            <Heart className="mr-2 h-3.5 w-3.5" />
            Set as main image
        </DropdownMenuItem>
    )
}
