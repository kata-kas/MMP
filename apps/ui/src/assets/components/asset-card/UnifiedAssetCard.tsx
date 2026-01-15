import { Link, useNavigate } from "react-router-dom";
import type { Asset } from "@/assets/entities/Assets";
import { cn } from "@/lib/utils";
import { AssetCardThumbnail, getThumbnailUrl } from "./AssetCardThumbnail";
import { AssetCardContent } from "./AssetCardContent";
import { AssetCardActions } from "./AssetCardActions";

export type UnifiedAssetCardProps = {
	asset: Asset;
	onClick?: (asset: Asset) => void;
};

export function UnifiedAssetCard({ asset, onClick }: UnifiedAssetCardProps) {
	const navigate = useNavigate();
	const thumbnailUrl = getThumbnailUrl(asset);

	const CardContent = (
		<div
			className={cn(
				"asset-card m-2 flex h-56 w-56 flex-col items-center justify-end shadow-md rounded-lg overflow-hidden relative cursor-pointer hover:shadow-lg transition-shadow bg-card",
			)}
		>
			<AssetCardThumbnail
				url={thumbnailUrl}
				alt={asset.label || asset.id}
			/>

			<AssetCardContent asset={asset} />

			<AssetCardActions
				asset={asset}
				onNavigate={navigate}
				onModelClick={onClick ? () => onClick(asset) : undefined}
			/>
		</div>
	);

	if (onClick) {
		return (
			<div onClick={() => onClick(asset)} role="button" tabIndex={0} onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					onClick(asset);
				}
			}}>
				{CardContent}
			</div>
		);
	}

	return (
		<Link to={`/assets/${asset.id}`} className="block">
			{CardContent}
		</Link>
	);
}
