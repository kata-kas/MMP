import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { useApiQuery } from "@/hooks/use-api-query";
import type { Asset, Tag } from "@/assets/entities/Assets";
import { Badge } from "@/components/ui/badge";
import {
	File,
	Folder,
	Image as ImageIcon,
	Box,
	FileCode,
	Archive,
} from "lucide-react";

type SearchDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

function getAssetIcon(asset: Asset) {
	if (asset.node_kind === "bundle") {
		return <Archive className="h-4 w-4" />;
	}
	if (asset.node_kind === "dir" || asset.node_kind === "root") {
		return <Folder className="h-4 w-4" />;
	}
	if (asset.kind === "image") {
		return <ImageIcon className="h-4 w-4" />;
	}
	if (asset.kind === "model") {
		return <Box className="h-4 w-4" />;
	}
	if (asset.kind === "slice" || asset.kind === "source") {
		return <FileCode className="h-4 w-4" />;
	}
	return <File className="h-4 w-4" />;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
	const navigate = useNavigate();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [page, setPage] = useState(1);

	const { data: allTags } = useApiQuery<Tag[]>({
		url: "/tags",
		enabled: open,
	});

	const tagValues = useMemo(() => {
		return allTags?.map((t) => t.value) ?? [];
	}, [allTags]);

	const searchParams = useMemo(() => {
		const params: { name?: string; tags?: string; page?: string; per_page?: string } = {};
		if (searchQuery.trim()) {
			params.name = searchQuery.trim();
		}
		if (selectedTags.length > 0) {
			params.tags = selectedTags.join(",");
		}
		if (page > 1) {
			params.page = page.toString();
		}
		params.per_page = "20";
		return params;
	}, [searchQuery, selectedTags, page]);

	const { data, loading } = useApiQuery<{
		assets?: Asset[];
		total_pages?: number;
		page?: number;
	}>({
		url:
			searchParams.name || searchParams.tags
				? `/assets/search?${new URLSearchParams(searchParams as Record<string, string>).toString()}`
				: "",
		enabled: open && (!!searchParams.name || !!searchParams.tags),
	});

	const assets = data?.assets ?? [];

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				onOpenChange(!open);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, [open, onOpenChange]);

	const handleSelect = (asset: Asset) => {
		navigate(`/assets/${asset.id}`);
		onOpenChange(false);
		setSearchQuery("");
		setSelectedTags([]);
		setPage(1);
	};

	useEffect(() => {
		setPage(1);
	}, [searchQuery, selectedTags]);

	const filteredTags = useMemo(() => {
		if (!searchQuery) return tagValues;
		const query = searchQuery.toLowerCase();
		return tagValues.filter((tag) => tag.toLowerCase().includes(query));
	}, [tagValues, searchQuery]);

	const handleTagToggle = (tag: string) => {
		setSelectedTags((prev) =>
			prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
		);
		setSearchQuery("");
	};

	return (
		<CommandDialog open={open} onOpenChange={onOpenChange}>
			<CommandInput
				placeholder="Search assets by name or tags... (Press Cmd/Ctrl+K)"
				value={searchQuery}
				onValueChange={setSearchQuery}
			/>
			<CommandList>
				{selectedTags.length > 0 && (
					<CommandGroup heading="Selected Tags">
						<div className="flex flex-wrap gap-1 px-2 py-1.5">
							{selectedTags.map((tag) => (
								<Badge
									key={tag}
									variant="secondary"
									className="cursor-pointer"
									onClick={() => handleTagToggle(tag)}
								>
									{tag} ×
								</Badge>
							))}
						</div>
					</CommandGroup>
				)}

				{searchQuery &&
					filteredTags.length > 0 &&
					!selectedTags.includes(searchQuery.toLowerCase()) && (
						<CommandGroup heading="Tags">
							{filteredTags.slice(0, 5).map((tag) => (
								<CommandItem
									key={tag}
									onSelect={() => handleTagToggle(tag)}
									className="cursor-pointer"
								>
									<Badge variant="outline">{tag}</Badge>
									<span className="ml-2 text-xs text-muted-foreground">
										Add tag filter
									</span>
								</CommandItem>
							))}
						</CommandGroup>
					)}

				{loading && (
					<CommandEmpty>Searching...</CommandEmpty>
				)}

				{!loading && assets && assets.length > 0 && (
					<CommandGroup heading={`Assets${data?.total_pages && data.total_pages > 1 ? ` (Page ${data.page ?? page} of ${data.total_pages})` : ""}`}>
						{assets.map((asset) => (
							<CommandItem
								key={asset.id}
								onSelect={() => handleSelect(asset)}
								className="cursor-pointer"
							>
								{getAssetIcon(asset)}
								<div className="ml-2 flex-1 min-w-0">
									<div className="truncate font-medium">
										{asset.label || asset.id}
									</div>
									{asset.extension && (
										<div className="text-xs text-muted-foreground truncate">
											{asset.extension} {asset.kind && `• ${asset.kind}`}
										</div>
									)}
								</div>
								{asset.tags && asset.tags.length > 0 && (
									<div className="flex gap-1 ml-2">
										{asset.tags.slice(0, 2).map((tag) => (
											<Badge
												key={tag.value}
												variant="secondary"
												className="text-xs"
											>
												{tag.value}
											</Badge>
										))}
										{asset.tags.length > 2 && (
											<Badge variant="secondary" className="text-xs">
												+{asset.tags.length - 2}
											</Badge>
										)}
									</div>
								)}
							</CommandItem>
						))}
					</CommandGroup>
				)}

				{!loading &&
					assets &&
					assets.length === 0 &&
					(searchQuery || selectedTags.length > 0) && (
						<CommandEmpty>No assets found</CommandEmpty>
					)}

				{!searchQuery && selectedTags.length === 0 && (
					<CommandEmpty>
						Type to search assets or press Cmd/Ctrl+K to open
					</CommandEmpty>
				)}

				{data && data.total_pages && data.total_pages > 1 && (
					<div className="flex items-center justify-between border-t px-2 py-2">
						<button
							onClick={() => setPage(Math.max(1, page - 1))}
							disabled={page === 1}
							className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Previous
						</button>
						<span className="text-sm text-muted-foreground">
							Page {data.page ?? page} of {data.total_pages}
						</span>
						<button
							onClick={() => setPage(Math.min(data.total_pages || 1, page + 1))}
							disabled={page >= (data.total_pages || 1)}
							className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Next
						</button>
					</div>
				)}
			</CommandList>
		</CommandDialog>
	);
}
