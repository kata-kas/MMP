import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Checkbox } from "@/components/ui/checkbox";
import { FileIcon, Image as ImageIcon } from "lucide-react";
import { IconFile } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

type UploadPreviewProps = {
    selected: string
    files: File[]
    onChange: (name: string) => void;
};

function ImgView({ file }: { file: File }) {
    if (!file.type.startsWith("image/")) return null;
    const src = URL.createObjectURL(file)
    return (
        <AspectRatio ratio={1} className="flex-shrink-0 w-[100px]">
            <img src={src} alt={file.name} className="h-full w-full object-cover rounded-l-md" />
        </AspectRatio>
    )
}

export function UploadPreview({ files, selected, onChange }: UploadPreviewProps) {
    const isImage = (f: File) => f.type.startsWith("image/");

    return (
        <div className="mt-4 grid grid-cols-3 gap-4">
            {files.sort((f1) => (isImage(f1) ? -1 : 0)).map((f, i) => (
                <Card key={i} className="p-0 overflow-hidden">
                    <div className="flex items-center gap-0">
                        {isImage(f) ? (
                            <ImgView file={f} />
                        ) : (
                            <AspectRatio ratio={1} className="flex-shrink-0 w-[100px] flex items-center justify-center bg-muted">
                                <IconFile className="h-8 w-8 text-muted-foreground" />
                            </AspectRatio>
                        )}
                        <div className={cn("px-3 py-2 flex-1", isImage(f) ? "w-[120px]" : "w-[180px]")}>
                            <p className="text-sm truncate">
                                {f.name}
                            </p>
                        </div>
                        {isImage(f) && (
                            <div className="p-3 ml-auto">
                                <Checkbox
                                    checked={selected === f.name}
                                    onCheckedChange={() => onChange(f.name)}
                                />
                            </div>
                        )}
                    </div>
                </Card>
            ))}
        </div>
    )
}
