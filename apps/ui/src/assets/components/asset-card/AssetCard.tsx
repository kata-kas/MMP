import { Asset } from "@/assets/entities/Assets";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Icon3dRotate, IconFile, IconFile3d, IconFileTypePdf, IconZoomScan } from "@tabler/icons-react";
import { DropDownMenu } from "../parts/drop-down-menu/DropDownMenu";
import { SetAsMain } from "../parts/set-as-main/SetAsMain";
import { SettingsContext } from "@/core/settings/settingsContext";
import { useCallback, useContext, useState } from "react";
import { Lightbox } from "react-modal-image";
import { SelectBtn } from "../parts/select-btn/SelectBtn";
import { cn } from "@/lib/utils";

type AssetCardProps = {
    asset: Asset;
    focused: boolean;
    onFocused: () => void;
    onDelete: () => void;
    onChange: () => void;
    view3d: boolean;
    onView3dChange: (arg0: boolean) => void;
}

const iconMap = new Map<string, JSX.Element>();
iconMap.set('.pdf', <IconFileTypePdf />);
iconMap.set('.jpg', <IconFile />);
iconMap.set('.stl', <IconFile3d />);

export function AssetCard({ asset, focused, onFocused, onDelete, onChange, view3d, onView3dChange }: AssetCardProps) {
    const { settings, ready } = useContext(SettingsContext);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const toggleLoadingCallback = useCallback(() => {
        setLoading((l) => !l)
    }, [])

    const baseUrl = (ready && settings?.localBackend && settings.localBackend !== '') 
        ? settings.localBackend 
        : '/api';
    const imageUrl = asset.image_id && asset.image_id !== "" 
        ? `${baseUrl}/projects/${asset.project_uuid}/assets/${asset.image_id}/file`
        : null;

    return (
        <>
            {modal && imageUrl && <Lightbox
                medium={imageUrl}
                large={imageUrl}
                hideDownload={true}
                onClose={() => setModal(false)}
            />}
            <Card className={cn("min-w-[280px] w-[280px]", focused && "border-destructive")}>
                <CardHeader className="p-0 mb-3 cursor-pointer" onClick={() => setModal(true)}>
                    <AspectRatio ratio={16 / 9}>
                        {asset?.image_id === "" || !asset.image_id ? (
                            <div className="flex items-center justify-center h-full bg-muted">
                                {iconMap.get(asset.extension) ?? <IconFile className="h-12 w-12 text-muted-foreground" />}
                            </div>
                        ) : imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={asset.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                }}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full bg-muted">
                                <Skeleton className="h-full w-full" />
                            </div>
                        )}
                    </AspectRatio>
                </CardHeader>

                <CardContent className="p-4 pb-2">
                    <p className="font-bold text-lg cursor-pointer" onClick={() => { onFocused() }}>
                        {asset.label != "" ? asset.label : asset.name}
                    </p>
                </CardContent>

                {loading && (
                    <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                        <Skeleton className="h-12 w-12 rounded-full" />
                    </div>
                )}
                
                <CardFooter className="pt-2 pb-4 px-4 border-t">
                    <div className="flex justify-end gap-0">
                        {asset.extension == '.stl' &&
                            onView3dChange &&
                            view3d !== undefined &&
                            <SelectBtn selected={view3d} onChange={onView3dChange} icon={<Icon3dRotate />} />}
                        {asset.image_id && asset.image_id != "" && (
                            <Button variant="ghost" size="icon" onClick={() => setModal(true)}>
                                <IconZoomScan className="h-5 w-5 text-destructive" stroke={1.5} />
                            </Button>
                        )}
                        <DropDownMenu
                            projectUuid={asset.project_uuid}
                            id={asset.id}
                            openDetails={() => { onFocused() }}
                            downloadURL={imageUrl ? `${baseUrl}/projects/${asset.project_uuid}/assets/${asset.id}/file?download=true` : undefined}
                            onDelete={onDelete}
                            toggleLoad={toggleLoadingCallback}>
                            <SetAsMain projectUuid={asset.project_uuid} assetId={asset.image_id} onChange={onChange} />
                        </DropDownMenu>
                    </div>
                </CardFooter>
            </Card>
        </>)
}
