import { UnifiedAssetCard } from "@/assets/components/asset-card/UnifiedAssetCard";
import { AssetCardSkeleton } from "./AssetCardSkeleton";
import type { Asset } from "@/assets/entities/Assets";

interface AssetGridProps {
    assets: Asset[];
    loading?: boolean;
    onAssetClick?: (asset: Asset) => void;
}

export function AssetGrid({ assets, loading, onAssetClick }: AssetGridProps) {
    if (loading) {
        return (
            <div className="flex flex-row flex-wrap content-start items-start w-full">
                {Array.from({ length: 8 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items need consistent keys
                    <AssetCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (assets.length === 0) {
        return <div className="text-muted-foreground p-4">No contents</div>;
    }

    return (
        <div className="flex flex-row flex-wrap content-start items-start w-full">
            {assets.map((asset) => (
                <UnifiedAssetCard
                    key={asset.id}
                    asset={asset}
                    onClick={onAssetClick}
                />
            ))}
        </div>
    );
}
