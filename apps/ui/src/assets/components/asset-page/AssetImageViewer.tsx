import { useContext, useMemo, useState } from "react";
import type { Asset } from "@/assets/entities/Assets";
import { SettingsContext } from "@/core/settings/settingsContext";

const IMAGE_EXTENSIONS = [
	".jpg",
	".jpeg",
	".png",
	".gif",
	".webp",
	".bmp",
	".svg",
];

export function isImageAsset(asset: Asset): boolean {
	if (asset.kind === "image") return true;
	if (asset.extension) {
		return IMAGE_EXTENSIONS.includes(asset.extension.toLowerCase());
	}
	return false;
}

export function AssetImageViewer({ asset }: { asset: Asset }) {
	const { settings, ready } = useContext(SettingsContext);
	const baseUrl =
		ready && settings?.localBackend && settings.localBackend !== ""
			? settings.localBackend
			: "/api";

	const src = useMemo(
		() => `${baseUrl}/assets/${asset.id}/file`,
		[baseUrl, asset.id],
	);
	const [error, setError] = useState(false);

	if (error) {
		return (
			<div className="text-sm text-muted-foreground">Failed to load image.</div>
		);
	}

	return (
		<div className="flex w-full items-center justify-center">
			<img
				src={src}
				alt={asset.label || asset.id}
				className="max-h-[70vh] w-auto max-w-full rounded-md object-contain"
				loading="lazy"
				onError={() => setError(true)}
			/>
		</div>
	);
}
