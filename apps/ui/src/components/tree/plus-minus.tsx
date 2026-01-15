import { hotkeysCoreFeature, syncDataLoaderFeature } from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import { FileIcon, FolderIcon, FolderOpenIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tree, TreeItem, TreeItemLabel } from "@/components/ui/tree";

export type TreeNode = {
	name: string;
	children?: string[];
};

type PlusMinusTreeProps = {
	rootId: string;
	items: Record<string, TreeNode>;
	selectedLeafId?: string;
	defaultExpandedIds?: string[];
	onSelectLeaf?: (id: string) => void;
	className?: string;
};

const INDENT = 20;

export function PlusMinusTree({
	rootId,
	items,
	selectedLeafId,
	defaultExpandedIds,
	onSelectLeaf,
	className,
}: PlusMinusTreeProps) {
	const tree = useTree<TreeNode>({
		initialState: {
			expandedItems: defaultExpandedIds ?? [],
		},
		indent: INDENT,
		rootItemId: rootId,
		getItemName: (item) => item.getItemData().name,
		isItemFolder: (item) => (item.getItemData()?.children?.length ?? 0) > 0,
		dataLoader: {
			getItem: (itemId) => items[itemId] ?? { name: itemId },
			getChildren: (itemId) => items[itemId]?.children ?? [],
		},
		features: [syncDataLoaderFeature, hotkeysCoreFeature],
	});

	return (
		<div className={cn("min-w-0", className)}>
			<Tree indent={INDENT} tree={tree} toggleIconType="plus-minus">
				{tree.getItems().map((item) => {
					const id = item.getId();
					const isLeaf = !item.isFolder();
					const isSelected = isLeaf && selectedLeafId === id;

					return (
						<TreeItem
							key={id}
							item={item}
							onClick={() => {
								if (!isLeaf) return;
								onSelectLeaf?.(id);
							}}
						>
							<TreeItemLabel
								className={cn(
									"relative",
									isSelected && "bg-accent text-accent-foreground",
								)}
							>
								<span className="ml-1 flex items-center gap-2">
									{item.isFolder() ? (
										item.isExpanded() ? (
											<FolderOpenIcon className="h-4 w-4 text-muted-foreground" />
										) : (
											<FolderIcon className="h-4 w-4 text-muted-foreground" />
										)
									) : (
										<FileIcon className="h-4 w-4 text-muted-foreground" />
									)}
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
