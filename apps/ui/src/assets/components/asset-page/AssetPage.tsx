import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { Asset } from "@/assets/entities/Assets";
import { Separator } from "@/components/ui/separator";
import { useSetBreadcrumbs } from "@/core/breadcrumbs/BreadcrumbContext";
import { ErrorBoundary } from "@/core/error-boundary/ErrorBoundary";
import { AssetDetails } from "../asset-details/AssetDetails";
import { AssetImageViewer, isImageAsset } from "./AssetImageViewer";
import { AssetModelViewer } from "./AssetModelViewer";
import { AssetPdfViewer, isPdfAsset } from "./AssetPdfViewer";
import { useAssetData } from "./useAssetData";

export function AssetPage() {
	const { id } = useParams<{ id: string }>();
	const { asset, nestedAssets, loading, error } = useAssetData(id);
	const [assetState, setAssetState] = useState<Asset | null>(null);

	const breadcrumbs = useMemo(() => {
		const current = assetState ?? asset;
		if (!current) return null;

		const buildCrumbs = (
			currentAsset: Asset,
		): Array<{ label: string; path?: string }> => {
			const crumbs: Array<{ label: string; path?: string }> = [];
			if (currentAsset.parent) {
				crumbs.push(...buildCrumbs(currentAsset.parent));
			}
			crumbs.push({
				label: currentAsset.label || currentAsset.id,
				path: `/assets/${currentAsset.id}`,
			});
			return crumbs;
		};

		return [
			{ label: "Assets", path: "/assets" },
			...(current.parent ? buildCrumbs(current.parent) : []),
			{ label: current.label || current.id, path: undefined },
		];
	}, [asset, assetState]);

	useSetBreadcrumbs(breadcrumbs);

	if (loading && !asset) {
		return <div className="p-4">Loading asset...</div>;
	}

	if (error) {
		return (
			<div className="p-4 text-destructive">
				Error loading asset: {error.message}
			</div>
		);
	}

	if (!asset) {
		return <div className="p-4">Asset not found</div>;
	}

	const current = assetState ?? asset;
	const isModel = current.kind === "model" && current.node_kind === "file";
	const isImage = current.node_kind === "file" && isImageAsset(current);
	const isPdf = current.node_kind === "file" && isPdfAsset(current);

	return (
		<div className="flex h-full min-w-0 flex-col overflow-hidden">
			<div className="flex min-h-0 flex-1 flex-col overflow-auto p-4">
				<ErrorBoundary>
					{isModel ? (
						<AssetModelViewer asset={current} />
					) : isImage ? (
						<AssetImageViewer asset={current} />
					) : isPdf ? (
						<AssetPdfViewer asset={current} />
					) : (
						<div className="text-sm text-muted-foreground">
							Preview not available for this asset type.
						</div>
					)}
				</ErrorBoundary>
			</div>
			<div className="border-t p-4">
				<div className="mb-3 flex items-center justify-between">
					<div className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-sm font-medium">
						{current.label || current.id}
					</div>
					<div className="text-xs text-muted-foreground">
						{nestedAssets.length > 0 ? `${nestedAssets.length} children` : ""}
					</div>
				</div>
				<Separator className="mb-3" />
				<AssetDetails asset={current} onAssetUpdate={(a) => setAssetState(a)} />
			</div>
		</div>
	);
}
