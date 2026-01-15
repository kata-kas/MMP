import { useState } from "react";
import type { Asset } from "@/assets/entities/Assets";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"];

function isImageAsset(asset: Asset): boolean {
    if (asset.kind === "image") return true;
    if (asset.extension) {
        return IMAGE_EXTENSIONS.includes(asset.extension.toLowerCase());
    }
    return false;
}

export function getThumbnailUrl(asset: Asset): string | null {
    // Prefer explicit thumbnail
    if (asset.thumbnail) {
        return `/api/assets/${asset.thumbnail}/file`;
    }

    // Fallback to asset itself if it's an image
    if (isImageAsset(asset) && asset.id) {
        return `/api/assets/${asset.id}/file`;
    }

    return null;
}

interface AssetCardThumbnailProps {
    url: string | null;
    alt: string;
}

export function AssetCardThumbnail({ url, alt }: AssetCardThumbnailProps) {
    const [imageError, setImageError] = useState(false);

    return (
        <div className="absolute inset-0 w-full h-full bg-gray-300 rounded-lg overflow-hidden">
            {url && !imageError ? (
                <>
                    <img
                        src={url}
                        alt={alt}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent rounded-lg" />
                </>
            ) : (
                <div className="absolute inset-0 bg-gray-300 rounded-lg" />
            )}
        </div>
    );
}
