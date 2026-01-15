import {
    Folder,
    File,
    Image as ImageIcon,
    Box,
    FileCode,
    Archive,
} from "lucide-react";
import type { Asset } from "@/assets/entities/Assets";
import { Badge } from "@/components/ui/badge";

export function getAssetIcon(asset: Asset) {
    if (asset.node_kind === "bundle") {
        return <Archive className="h-5 w-5" />;
    }
    if (asset.node_kind === "dir" || asset.node_kind === "root") {
        return <Folder className="h-5 w-5" />;
    }
    if (asset.kind === "image") {
        return <ImageIcon className="h-5 w-5" />;
    }
    if (asset.kind === "model") {
        return <Box className="h-5 w-5" />;
    }
    if (asset.kind === "slice" || asset.kind === "source") {
        return <FileCode className="h-5 w-5" />;
    }
    return <File className="h-5 w-5" />;
}

interface AssetCardContentProps {
    asset: Asset;
}

export function AssetCardContent({ asset }: AssetCardContentProps) {
    const hasTags = asset.tags && asset.tags.length > 0;

    return (
        <div className="z-10 flex flex-col max-w-56 items-center justify-center pb-2 px-2 gap-1">
            <div className="flex items-center justify-center">
                <div className="text-white">{getAssetIcon(asset)}</div>
                <div className="truncate px-2 text-white text-sm font-medium">
                    {asset.label || asset.id}
                </div>
            </div>
            {hasTags && (
                <div className="flex flex-wrap gap-1 justify-center max-w-full">
                    {asset.tags.slice(0, 2).map((tag) => (
                        <Badge
                            key={tag.value}
                            variant="secondary"
                            className="text-xs px-1.5 py-0.5 h-auto"
                        >
                            {tag.value}
                        </Badge>
                    ))}
                    {asset.tags.length > 2 && (
                        <Badge
                            variant="secondary"
                            className="text-xs px-1.5 py-0.5 h-auto"
                        >
                            +{asset.tags.length - 2}
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
}
