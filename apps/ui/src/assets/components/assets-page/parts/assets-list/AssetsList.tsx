import { useApiQuery } from "@/hooks/use-api-query";
import type { Asset } from "@/assets/entities/Assets";

export function AssetsList() {
	const { data: assets, loading, error } = useApiQuery<Asset[]>({
		url: "/assets?deep=true",
	});

	if (loading) {
		return <div>Loading assets...</div>;
	}

	if (error) {
		return <div>Error loading assets: {error.message}</div>;
	}

	if (!assets || assets.length === 0) {
		return <div>No assets found</div>;
	}

	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{assets.map((asset) => (
				<div key={asset.id} className="border rounded p-4">
					<h3 className="font-semibold">{asset.label || asset.id}</h3>
					{asset.description && (
						<p className="text-sm text-muted-foreground">
							{asset.description}
						</p>
					)}
					<div className="text-xs text-muted-foreground mt-2">
						{asset.node_kind}
					</div>
				</div>
			))}
		</div>
	);
}
