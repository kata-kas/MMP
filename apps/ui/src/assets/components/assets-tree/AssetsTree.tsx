import type { ItemInstance } from "@headless-tree/core";
import {
	asyncDataLoaderFeature,
	hotkeysCoreFeature,
} from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import {
	Archive,
	Box,
	File as FileIcon,
	FileCode,
	FolderIcon,
	FolderOpenIcon,
	Image as ImageIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Asset } from "@/assets/entities/Assets";
import { Tree, TreeItem, TreeItemLabel } from "@/components/ui/tree";
import { useApiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type Node = {
	name: string;
	isFolder: boolean;
	assetId?: string;
	kind?: string;
	nodeKind?: Asset["node_kind"];
	extension?: string;
};

type PagedAssetsResponse = {
	assets?: Asset[];
	total_pages?: number;
	page?: number;
	per_page?: number;
};

const ROOT_ID = "__assets_root__";
const PER_PAGE = 200;
const EXPANDED_STORAGE_KEY = "assets_tree_expanded_items";

async function fetchAllPages(
	fetchPage: (page0: number) => Promise<PagedAssetsResponse>,
): Promise<Asset[]> {
	const first = await fetchPage(0);
	const assets: Asset[] = first.assets ?? [];
	const totalPages = first.total_pages ?? 1;
	for (let p = 1; p < totalPages; p++) {
		const next = await fetchPage(p);
		assets.push(...(next.assets ?? []));
	}
	return assets;
}

function assetLabel(a: Asset): string {
	const base =
		a.label ||
		(a.path ? a.path.split("/").filter(Boolean).slice(-1)[0] : "") ||
		a.id;

	if (a.node_kind !== "file") return base;
	if (!a.extension) return base;

	const ext = a.extension.startsWith(".") ? a.extension : `.${a.extension}`;
	if (base.toLowerCase().endsWith(ext.toLowerCase())) return base;
	return `${base}${ext}`;
}

function getNodeIcon(node: Node | null, expanded: boolean) {
	if (!node) return <FileIcon className="h-4 w-4 text-muted-foreground" />;

	if (node.nodeKind === "bundle") {
		return <Archive className="h-4 w-4 text-muted-foreground" />;
	}

	if (node.isFolder) {
		return expanded ? (
			<FolderOpenIcon className="h-4 w-4 text-muted-foreground" />
		) : (
			<FolderIcon className="h-4 w-4 text-muted-foreground" />
		);
	}

	if (node.kind === "image") {
		return <ImageIcon className="h-4 w-4 text-muted-foreground" />;
	}
	if (node.kind === "model") {
		return <Box className="h-4 w-4 text-muted-foreground" />;
	}
	if (node.kind === "slice" || node.kind === "source") {
		return <FileCode className="h-4 w-4 text-muted-foreground" />;
	}

	return <FileIcon className="h-4 w-4 text-muted-foreground" />;
}

export function AssetsTree({
	selectedAssetId,
	className,
}: {
	selectedAssetId?: string;
	className?: string;
}) {
	const api = useApiClient();
	const navigate = useNavigate();

	const [expandedItems, setExpandedItems] = useState<string[]>(() => {
		try {
			const raw = localStorage.getItem(EXPANDED_STORAGE_KEY);
			const parsed = raw ? (JSON.parse(raw) as unknown) : null;
			const arr = Array.isArray(parsed)
				? parsed.filter((x): x is string => typeof x === "string")
				: [];
			return arr.length > 0 ? arr : [ROOT_ID];
		} catch {
			return [ROOT_ID];
		}
	});

	const itemsRef = useRef<Map<string, Node>>(new Map());
	const childrenRef = useRef<Map<string, string[]>>(new Map());
	const inFlightRef = useRef<Map<string, Promise<string[]>>>(new Map());

	useMemo(() => {
		if (!itemsRef.current.has(ROOT_ID)) {
			itemsRef.current.set(ROOT_ID, {
				name: "Assets",
				isFolder: true,
				nodeKind: "root",
			});
		}
		return null;
	}, []);

	const loadChildren = async (id: string): Promise<string[]> => {
		const cached = childrenRef.current.get(id);
		if (cached) return cached;

		const inflight = inFlightRef.current.get(id);
		if (inflight) return inflight;

		const promise = (async () => {
			let assets: Asset[] = [];

			if (id === ROOT_ID) {
				assets = await fetchAllPages((page0) =>
					api
						.get<PagedAssetsResponse>(
							`/assets?page=${page0}&per_page=${PER_PAGE}`,
						)
						.then((r) => r.data),
				);
			} else {
				assets = await fetchAllPages((page0) =>
					api
						.get<PagedAssetsResponse>(
							`/assets/${encodeURIComponent(id)}/nested?page=${page0}&per_page=${PER_PAGE}`,
						)
						.then((r) => r.data),
				);
			}

			const childIds = assets.map((a) => a.id);
			for (const a of assets) {
				itemsRef.current.set(a.id, {
					name: assetLabel(a),
					isFolder: a.node_kind !== "file",
					assetId: a.id,
					kind: a.kind,
					nodeKind: a.node_kind,
					extension: a.extension,
				});
			}

			childrenRef.current.set(id, childIds);
			return childIds;
		})().finally(() => {
			inFlightRef.current.delete(id);
		});

		inFlightRef.current.set(id, promise);
		return promise;
	};

	const tree = useTree<Node>({
		rootItemId: ROOT_ID,
		state: { expandedItems },
		setExpandedItems,
		getItemName: (item) => item.getItemData()?.name ?? item.getId(),
		isItemFolder: (item) => !!item.getItemData()?.isFolder,
		dataLoader: {
			getItem: async (itemId) => {
				if (!itemsRef.current.has(itemId)) {
					itemsRef.current.set(itemId, {
						name: itemId,
						isFolder: true,
						assetId: itemId,
					});
				}
				return itemsRef.current.get(itemId) as Node;
			},
			getChildren: async (itemId) => {
				return await loadChildren(itemId);
			},
		},
		features: [asyncDataLoaderFeature, hotkeysCoreFeature],
	});

	useEffect(() => {
		try {
			localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(expandedItems));
		} catch {
			// ignore
		}
	}, [expandedItems]);

	useEffect(() => {
		if (!selectedAssetId) return;
		let cancelled = false;

		(async () => {
			const toExpand: string[] = [];
			const seen = new Set<string>();

			let currentId: string | undefined = selectedAssetId;
			for (let i = 0; i < 64 && currentId; i++) {
				if (seen.has(currentId)) break;
				seen.add(currentId);

				const asset = await api
					.get<Asset>(`/assets/${encodeURIComponent(currentId)}`)
					.then((r) => r.data);

				if (asset.node_kind === "root") break;
				if (asset.node_kind !== "file" && currentId !== selectedAssetId) {
					toExpand.push(currentId);
				}

				currentId = asset.parent_id;
			}

			if (cancelled || toExpand.length === 0) return;
			setExpandedItems((prev) => Array.from(new Set([...prev, ...toExpand])));
		})().catch(() => {
			// ignore
		});

		return () => {
			cancelled = true;
		};
	}, [api, selectedAssetId]);

	return (
		<div className={cn("min-w-0", className)}>
			<Tree indent={18} tree={tree} toggleIconType="plus-minus">
				{tree.getItems().map((item) => {
					const id = item.getId();
					const data = item.getItemData();
					const isFolder = !!data?.isFolder;
					const isSelected = !!selectedAssetId && selectedAssetId === id;
					const icon = getNodeIcon(
						data
							? {
									...data,
									isFolder,
								}
							: null,
						item.isExpanded(),
					);

					return (
						<TreeItem
							key={id}
							item={item as unknown as ItemInstance<Node>}
							onClick={() => {
								if (id === ROOT_ID) return;
								navigate(`/assets/${id}`);
							}}
						>
							<TreeItemLabel
								className={cn(
									"w-full",
									isSelected && "bg-accent text-accent-foreground",
								)}
							>
								<span className="ml-1 flex items-center gap-2">
									{icon}
									{item.getItemName()}
								</span>
							</TreeItemLabel>
						</TreeItem>
					);
				})}
			</Tree>
		</div>
	);
}
