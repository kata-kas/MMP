import { Asset } from "@/assets/entities/Assets";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import dayjs from 'dayjs'
import { useEffect, useState } from "react";

type AssetDetailsProps = {
    asset: Asset;
}

export function AssetDetails({ asset }: AssetDetailsProps) {
    const [tab, setTab] = useState<string>('file')
    const [propFilter, setPropFilter] = useState("")

    useEffect(() => {
        if (asset && Object.keys(asset.properties).length > 0) {
            setTab('properties')
        } else {
            setTab('file')
        }
    }, [asset])
    
    const formatBytes = (bytes: number, decimals: number) => {
        if (bytes == 0) return '0 Bytes';
        const k = 1024,
            dm = decimals || 2,
            sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    
    return (
        <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
                {asset && Object.keys(asset.properties).length > 0 && (
                    <TabsTrigger value="properties">Properties</TabsTrigger>
                )}
                <TabsTrigger value="file">File</TabsTrigger>
            </TabsList>

            {asset && Object.keys(asset.properties).length > 0 && (
                <TabsContent value="properties" className="space-y-4">
                    <Input placeholder="Filter" value={propFilter} onChange={(e) => setPropFilter(e.target.value)} />
                    <ScrollArea className="h-[800px]">
                        {Object.keys(asset.properties).filter(k => k.includes(propFilter)).map((k: string) => (
                            <div key={k} className="flex gap-2 mt-2">
                                <Input disabled value={k} className="flex-1" />
                                <Input disabled value={asset.properties[k]} className="flex-1" />
                            </div>
                        ))}
                    </ScrollArea>
                </TabsContent>
            )}

            <TabsContent value="file" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {asset.mod_time && (
                        <div className="space-y-2">
                            <Label>Last Modified</Label>
                            <Input disabled value={dayjs(asset.mod_time).toString()} />
                        </div>
                    )}
                    {asset.size && (
                        <div className="space-y-2">
                            <Label>Size</Label>
                            <Input disabled value={formatBytes(asset.size, 2)} />
                        </div>
                    )}
                    {asset.extension && (
                        <div className="space-y-2">
                            <Label>Extension</Label>
                            <Input disabled value={asset.extension} />
                        </div>
                    )}
                    {asset.mime_type && (
                        <div className="space-y-2">
                            <Label>Mime type</Label>
                            <Input disabled value={asset.mime_type} />
                        </div>
                    )}
                </div>
            </TabsContent>
        </Tabs>
    )
}
