import { useParams } from "react-router-dom";
import { useApiQuery } from "@/hooks/use-api-query";
import type { Asset } from "@/assets/entities/Assets";

export function AssetPage() {
	const { id } = useParams<{ id: string }>();

	const { data: asset, loading, error } = useApiQuery<Asset>({
		url: id ? `/assets/${id}?deep=true` : "",
		enabled: !!id,
	});

	if (loading) {
		return <div>Loading asset...</div>;
	}

	if (error) {
		return <div>Error loading asset: {error.message}</div>;
	}

	if (!asset) {
		return <div>Asset not found</div>;
	}

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-2xl font-bold">{asset.label || asset.id}</h1>
				{asset.description && (
					<p className="text-muted-foreground">{asset.description}</p>
				)}
			</div>

			{asset.nested_assets && asset.nested_assets.length > 0 && (
				<div>
					<h2 className="text-xl font-semibold mb-2">Contents</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{asset.nested_assets.map((nested) => (
							<div key={nested.id} className="border rounded p-4">
								<h3 className="font-semibold">
									{nested.label || nested.id}
								</h3>
								<div className="text-xs text-muted-foreground mt-2">
									{nested.node_kind}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
