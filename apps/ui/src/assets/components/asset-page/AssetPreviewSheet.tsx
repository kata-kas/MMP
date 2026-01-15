import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import type { Asset } from "@/assets/entities/Assets";
import { AssetModelViewer } from "./AssetModelViewer";

interface AssetPreviewSheetProps {
    asset: Asset | null;
    isOpen: boolean;
    onClose: () => void;
}

export function AssetPreviewSheet({
    asset,
    isOpen,
    onClose,
}: AssetPreviewSheetProps) {
    if (!asset) return null;

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-[80vw] sm:max-w-[80vw] p-0 flex flex-col gap-0">
                <SheetHeader className="px-6 py-4 border-b">
                    <SheetTitle>{asset.label || asset.id}</SheetTitle>
                    <SheetDescription className="text-xs font-mono text-muted-foreground truncate">
                        {asset.id}
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 relative flex flex-col min-h-0 bg-muted/10">
                    {asset.kind === "model" && asset.node_kind === "file" ? (
                        <AssetModelViewer asset={asset} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Preview not available for this asset type
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-background">
                    <h4 className="text-sm font-medium mb-2">Asset Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div className="text-muted-foreground">Type</div>
                        <div className="capitalize">{asset.kind}</div>
                        <div className="text-muted-foreground">Extension</div>
                        <div>{asset.extension || "-"}</div>
                    </div>
                    {asset.tags && asset.tags.length > 0 && (
                        <div className="mt-3">
                            <div className="text-sm font-medium mb-2">Tags</div>
                            <div className="flex flex-wrap gap-1">
                                {asset.tags.map((tag) => (
                                    <span
                                        key={tag.value}
                                        className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
                                    >
                                        {tag.value}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
