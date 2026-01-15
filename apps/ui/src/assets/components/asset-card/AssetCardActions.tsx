import { Link } from "react-router-dom";
import { Box, MoreVertical } from "lucide-react";
import type { Asset } from "@/assets/entities/Assets";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AssetCardActionsProps {
    asset: Asset;
    onNavigate: (path: string) => void;
    onModelClick?: () => void;
}

export function AssetCardActions({ asset, onNavigate, onModelClick }: AssetCardActionsProps) {
    const handleClick = (e: React.MouseEvent, action: () => void) => {
        e.preventDefault();
        e.stopPropagation();
        action();
    };

    return (
        <div
            className="controls absolute top-1 right-1 z-10 flex gap-1"
            onClick={(e) => e.stopPropagation()}
        >
            {asset.kind === "model" && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20 bg-black/20"
                    onClick={(e) => handleClick(e, () => {
                        if (onModelClick) {
                            onModelClick();
                        } else {
                            onNavigate(`/assets/${asset.id}`);
                        }
                    })}
                    aria-label="View 3D Model"
                >
                    <Box className="h-4 w-4" />
                </Button>
            )}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:bg-white/20 bg-black/20"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        aria-label="More actions"
                    >
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                        <Link to={`/assets/${asset.id}`}>Details</Link>
                    </DropdownMenuItem>
                    {asset.path && (
                        <DropdownMenuItem asChild>
                            <a
                                href={`/api/assets/${asset.id}/file?download=true`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Download
                            </a>
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
