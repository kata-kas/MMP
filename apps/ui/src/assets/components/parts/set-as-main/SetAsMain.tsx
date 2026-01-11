import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { useCallback } from "react";
import { logger } from "@/lib/logger";
import { useApiMutation } from "@/hooks/use-api-mutation";

export type SetAsMainProps = {
    projectUuid: string;
    assetId?: string;
    onChange: () => void;
}

export function SetAsMain({ projectUuid, assetId, onChange }: SetAsMainProps) {
    const setMainImageMutation = useApiMutation<void, { uuid: string; default_image_id?: string }>({
        url: `/projects/${projectUuid}/image`,
        method: 'post',
    });

    const setMainImage = useCallback(() => {
        setMainImageMutation.mutate({
            uuid: projectUuid,
            default_image_id: assetId
        })
            .then(() => {
                toast.success('Great Success!', {
                    description: 'Project main image updated!',
                })
                onChange()
            })
            .catch((e) => {
                logger.error(e)
            });
    }, [projectUuid, assetId, setMainImageMutation, onChange]);

    if (!assetId) return null;

    return (
        <DropdownMenuItem onClick={setMainImage}>
            <Heart className="mr-2 h-3.5 w-3.5" />
            Set as main image
        </DropdownMenuItem>
    )
}
