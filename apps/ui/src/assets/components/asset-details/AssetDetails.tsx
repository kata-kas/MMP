import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Asset, Tag } from "@/assets/entities/Assets";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TagsInput } from "@/components/ui/tags-input";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useApiQuery } from "@/hooks/use-api-query";

type AssetDetailsProps = {
	asset: Asset;
	onAssetUpdate?: (asset: Asset) => void;
};

const EMPTY_PROPERTIES: Record<string, unknown> = {};

export function AssetDetails({ asset, onAssetUpdate }: AssetDetailsProps) {
	const [tab, setTab] = useState<string>("file");
	const [propFilter, setPropFilter] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const properties = asset.properties ?? EMPTY_PROPERTIES;
	const hasProperties = Object.keys(properties).length > 0;
	const lastAssetIdRef = useRef<string | null>(null);

	const { data: allTags } = useApiQuery<Tag[]>({
		url: "/tags",
	});

	const tagValues = useMemo(() => {
		return allTags?.map((t) => t.value) ?? [];
	}, [allTags]);

	const updateAssetMutation = useApiMutation<Asset, Partial<Asset>>({
		url: `/assets/${asset.id}`,
		method: "put",
		onSuccess: (updatedAsset) => {
			toast.success("Tags updated");
			onAssetUpdate?.(updatedAsset);
		},
		onError: () => {
			toast.error("Failed to update tags");
		},
	});

	useEffect(() => {
		if (asset) {
			setTags(asset.tags?.map((t) => t.value) || []);
		}
	}, [asset]);

	useEffect(() => {
		if (lastAssetIdRef.current === asset.id) return;
		lastAssetIdRef.current = asset.id;
		setPropFilter("");
		setTab((prev) => {
			if (prev === "tags") return prev;
			return hasProperties ? "properties" : "file";
		});
	}, [asset.id, hasProperties]);

	const handleTagsChange = (newTags: string[]) => {
		setTags(newTags);
		updateAssetMutation.mutate({
			tags: newTags.map((value) => ({ value })),
		});
	};

	const formatBytes = (bytes: number, decimals: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024,
			dm = decimals || 2,
			sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
			i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
	};

	return (
		<Tabs value={tab} onValueChange={setTab}>
			<TabsList>
				{asset && hasProperties && (
					<TabsTrigger value="properties">Properties</TabsTrigger>
				)}
				<TabsTrigger value="tags">Tags</TabsTrigger>
				<TabsTrigger value="file">File</TabsTrigger>
			</TabsList>

			{asset && hasProperties && (
				<TabsContent value="properties" className="space-y-4">
					<Input
						placeholder="Filter"
						value={propFilter}
						onChange={(e) => setPropFilter(e.target.value)}
					/>
					<ScrollArea className="h-[800px]">
						{Object.keys(properties)
							.filter((k) => k.includes(propFilter))
							.map((k: string) => (
								<div key={k} className="flex gap-2 mt-2">
									<Input disabled value={k} className="flex-1" />
									<Input
										disabled
										value={String(properties[k] ?? "")}
										className="flex-1"
									/>
								</div>
							))}
					</ScrollArea>
				</TabsContent>
			)}

			<TabsContent value="tags" className="space-y-4">
				<div className="space-y-4">
					<div className="space-y-2">
						<Label>Tags</Label>
						<TagsInput
							value={tags}
							onChange={handleTagsChange}
							data={tagValues}
							placeholder="Add tags..."
							splitChars={[",", " ", "|"]}
							clearable
							disabled={updateAssetMutation.loading}
						/>
					</div>
					{tags.length === 0 && (
						<p className="text-sm text-muted-foreground">No tags assigned</p>
					)}
				</div>
			</TabsContent>

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
	);
}
