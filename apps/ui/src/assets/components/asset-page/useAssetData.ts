import { useApiQuery } from "@/hooks/use-api-query";
import type { Asset } from "@/assets/entities/Assets";

interface UseAssetDataResult {
    asset: Asset | undefined;
    nestedAssets: Asset[];
    loading: boolean;
    error: Error | undefined;
}

export function useAssetData(id: string | undefined): UseAssetDataResult {
    const { data: asset, loading: assetLoading, error: assetError } = useApiQuery<Asset>({
        url: id ? `/assets/${id}?deep=true` : "",
        enabled: !!id,
    });

    const { data: nestedData, loading: nestedLoading } = useApiQuery<{
        assets: Asset[];
        total_pages: number;
        page: number;
        per_page: number;
    }>({
        url: id ? `/assets/${id}/nested?page=1&per_page=20` : "",
        enabled: !!id && !!asset && asset.node_kind !== "file",
    });

    return {
        asset,
        nestedAssets: nestedData?.assets || [],
        loading: assetLoading || nestedLoading,
        error: assetError,
    };
}
