import { useDropzone } from "@/components/ui/dropzone";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import useAxios from "axios-hooks";
import { useContext } from "react";
import { SettingsContext } from "@/core/settings/settingsContext";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

type AddAssetProps = {
    projectUuid: string
}

export function AddAsset({ projectUuid }: AddAssetProps) {
    const { settings } = useContext(SettingsContext);
    const [{ loading }, executeSave] = useAxios(
        {
            url: `${settings.localBackend}/projects/${projectUuid}/assets`,
            method: 'POST'
        },
        {
            manual: true,
            autoCancel: false
        }
    )
    
    const dropzone = useDropzone({
        onDrop: (acceptedFiles) => {
            for (const file of acceptedFiles) {
                const formData = new FormData();
                formData.append("project_uuid", projectUuid);
                formData.append("files", file);
                executeSave({ data: formData })
                    .then(() => {
                        toast.success('Great Success!', {
                            description: 'Asset added to your project!',
                        })
                    })
                    .catch((e) => {
                        logger.error(e)
                    });
            }
        },
    });
    
    return (
        <div className="container mx-auto max-w-4xl">
            <div
                {...dropzone.getRootProps()}
                className={cn(
                    "flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
                    dropzone.isDragActive && "border-primary bg-primary/5",
                    loading && "opacity-50 pointer-events-none"
                )}
            >
                <input {...dropzone.getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                    {dropzone.isDragActive ? (
                        <Upload className="h-12 w-12 text-primary" />
                    ) : dropzone.isDragReject ? (
                        <X className="h-12 w-12 text-destructive" />
                    ) : (
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    )}
                    <div className="text-center">
                        <p className="text-xl font-medium">
                            Drag assets here or click to select files
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Attach as many files as you like
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
