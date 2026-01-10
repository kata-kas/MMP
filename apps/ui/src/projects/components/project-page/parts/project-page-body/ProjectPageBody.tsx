import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import useAxios from "axios-hooks";
import { Asset, AssetType } from "@/assets/entities/Assets.ts";
import { useContext, useEffect, useState } from "react";
import { ModelDetailPane } from "@/assets/components/model/model-detail-pane/ModelDetailPane.tsx";
import { IconSettings, IconFiles } from "@tabler/icons-react";
import { X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddAsset } from "./parts/add-asset/AddAsset.tsx";
import { EditProject } from "./parts/edit-project/EditProject.tsx";
import { Project } from "../../../../entities/Project.ts";
import { SettingsContext } from "@/core/settings/settingsContext.ts";
import { AssetDetails } from "@/assets/components/asset-details/AssetDetails.tsx";
import { Refresher } from "./parts/refresher/Refresher.tsx";
import { AssetCard } from "@/assets/components/asset-card/AssetCard.tsx";
import { cn } from "@/lib/utils";

type ProjectAssetsListProps = {
    projectUuid: string;
    project?: Project;
    onProjectChange: () => void;
}

export function ProjectPageBody({ projectUuid, project, onProjectChange }: ProjectAssetsListProps) {
    const { settings } = useContext(SettingsContext);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [selectedModels, setSelectedModels] = useState<Asset[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<Asset>();
    const [typeFilter, setTypeFilter] = useState<string | null>(searchParams.get('tab'));
    const [{ data: assetTypes, loading: tLoading, error: tError }] = useAxios<AssetType[]>(
        `${settings.localBackend}/assettypes`
    );
    const [{ data, loading, error }, refetch] = useAxios<Asset[]>(
        `${settings.localBackend}/projects/${projectUuid}/assets`
    );
    
    useEffect(() => {
        if (data) {
            setAssets(data);
        }
    }, [data]);

    useEffect(() => {
        if (selectedModels.length == 0) {
            setTypeFilter('all');
            navigate(`?tab=all`)
        } else {
            setTypeFilter('model');
            navigate(`?tab=model`)
        }
    }, [selectedModels, navigate]);

    const handleModelSelection = (asset: Asset, selected: boolean) => {
        setSelectedAsset(undefined)
        if (selected) {
            setSelectedModels(prev => [...prev, asset])
        } else {
            setSelectedModels(prev => prev.filter((a) => a.id != asset.id));
        }
    };

    const onFocus = (asset: Asset) => () => {
        setSelectedModels([])
        setSelectedAsset(asset)
    }

    return (
        <>
            {error && <p>Error!</p>}
            <div className="container mx-auto w-full my-2">
                <Tabs value={typeFilter || 'all'} onValueChange={(v) => {
                    setTypeFilter(v);
                    navigate(`?tab=${v}`)
                }}>
                    <TabsList>
                        <TabsTrigger value="all">
                            <IconFiles className="mr-2 h-3 w-3" />
                            All
                        </TabsTrigger>
                        {assetTypes && assetTypes.sort((a, b) => a.order - b.order).map((t) => (
                            <TabsTrigger key={t.name} value={t.name}>{t.label}</TabsTrigger>
                        ))}
                        <TabsTrigger value="other">Other</TabsTrigger>
                        <TabsTrigger value="add_asset" className="ml-auto">
                            <IconSettings className="mr-2 h-3 w-3" />
                            Add Asset
                        </TabsTrigger>
                        <TabsTrigger value="settings">
                            <IconSettings className="mr-2 h-3 w-3" />
                            Settings
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="add_asset" className="p-2">
                        <AddAsset projectUuid={projectUuid} />
                    </TabsContent>
                    <TabsContent value="settings" className="p-2">
                        {project && <EditProject onProjectChange={onProjectChange} project={project} />}
                    </TabsContent>
                </Tabs>
                <div className={cn(
                    "mt-3 grid gap-4",
                    (selectedAsset || selectedModels.length > 0) ? "grid-cols-2" : "grid-cols-1"
                )}>
                    <div className="flex flex-wrap gap-4 justify-center items-start">
                        {loading && Array.from(Array(3))
                            .map((_, i) => (
                                <Skeleton
                                    key={i}
                                    className="h-[280px] min-h-[280px] min-w-[280px] w-[280px]"
                                />
                            ))}

                        {assets?.filter(asset => asset.origin !== "render" && (typeFilter === 'all' || asset.asset_type === typeFilter))
                            .map(a => (
                                <AssetCard 
                                    key={a.id}
                                    asset={a}
                                    focused={selectedAsset?.id === a.id || (a.asset_type === 'model' && selectedModels.findIndex((sm) => sm.id === a.id) > -1)}
                                    onFocused={onFocus(a)}
                                    onDelete={refetch}
                                    onChange={onProjectChange}
                                    view3d={selectedModels.findIndex((sm) => a.id === sm.id) > -1}
                                    onView3dChange={(v: boolean) => { handleModelSelection(a, v) }}
                                />
                            ))}
                    </div>
                    {selectedModels.length > 0 && (
                        <ModelDetailPane 
                            projectUuid={projectUuid} 
                            onClose={() => setSelectedModels([])}
                            models={selectedModels} 
                        />
                    )}
                    {project && selectedAsset && (
                        <Alert>
                            <div className="flex items-center justify-between">
                                <AlertTitle>{selectedAsset.name}</AlertTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSelectedAsset(undefined)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <AlertDescription>
                                <AssetDetails asset={selectedAsset} />
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </div>
            <Refresher projectUUID={projectUuid} />
        </>
    );
}
