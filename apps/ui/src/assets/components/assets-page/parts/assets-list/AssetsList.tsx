import { useState, useMemo } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import type { Asset } from "@/assets/entities/Assets";
import { UnifiedAssetCard } from "@/assets/components/asset-card/UnifiedAssetCard";
import { Skeleton } from "@/components/ui/skeleton";
import { AssetFilter, type AssetFilter as AssetFilterType } from "../asset-filter/AssetFilter";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export function AssetsList() {
	const [filter, setFilter] = useState<AssetFilterType>({ name: "", tags: [] });
	const [searchParams, setSearchParams] = useState<{ name?: string; tags?: string }>({});
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState("20");

	const handleFilterChange = (newFilter: AssetFilterType) => {
		setFilter(newFilter);
		setPage(1);
		setSearchParams({
			...(newFilter.name ? { name: newFilter.name } : {}),
			...(newFilter.tags.length > 0 ? { tags: newFilter.tags.join(",") } : {}),
		});
	};

	const queryParams = useMemo(() => {
		const params = new URLSearchParams({
			page: (page - 1).toString(),
			per_page: perPage,
		});
		if (searchParams.name) params.append("name", searchParams.name);
		if (searchParams.tags) params.append("tags", searchParams.tags);
		return params.toString();
	}, [page, perPage, searchParams.name, searchParams.tags]);

	const { data, loading, error } = useApiQuery<{
		assets?: Asset[];
		page?: number;
		total_pages?: number;
	}>({
		url: searchParams.name || searchParams.tags
			? `/assets/search?${queryParams}`
			: `/assets?${queryParams}`,
	});

	const assets = data?.assets ?? [];

	if (loading) {
		return (
			<div className="flex flex-col gap-4 p-4">
				<div className="h-10 w-full">
					<Skeleton className="h-10 w-64" />
				</div>
				<div className="flex flex-row flex-wrap content-start items-start">
					{Array.from({ length: 8 }).map((_, i) => (
						<Skeleton key={i} className="h-56 w-56 m-2" />
					))}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col gap-4 p-4">
				<AssetFilter value={filter} onChange={handleFilterChange} />
				<div>Error loading assets: {error.message}</div>
			</div>
		);
	}

	if (!assets || assets.length === 0) {
		return (
			<div className="flex flex-col gap-4 p-4">
				<AssetFilter value={filter} onChange={handleFilterChange} />
				<div>No assets found</div>
			</div>
		);
	}

	return (
		<main className="flex flex-auto flex-col overflow-y-auto">
			<div className="p-4 border-b space-y-4">
				<div className="flex items-center gap-2">
					<AssetFilter value={filter} onChange={handleFilterChange} />
					<Select
						value={perPage}
						onValueChange={(v) => {
							if (v) {
								setPage(1);
								setPerPage(v);
							}
						}}
					>
						<SelectTrigger className="ml-auto w-[120px]">
							<SelectValue placeholder="Items per page" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="10">10</SelectItem>
							<SelectItem value="20">20</SelectItem>
							<SelectItem value="50">50</SelectItem>
							<SelectItem value="100">100</SelectItem>
						</SelectContent>
					</Select>
				</div>
				{data && data.total_pages && data.total_pages > 1 && (
					<Pagination>
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevious
									onClick={() => setPage(Math.max(1, page - 1))}
									className={
										page === 1
											? "pointer-events-none opacity-50"
											: "cursor-pointer"
									}
								/>
							</PaginationItem>
							<PaginationItem>
								<PaginationLink onClick={() => setPage(page)}>
									{data.page ?? page}
								</PaginationLink>
							</PaginationItem>
							<PaginationItem>
								<PaginationNext
									onClick={() =>
										setPage(Math.min(data.total_pages || 1, page + 1))
									}
									className={
										page >= (data.total_pages || 1)
											? "pointer-events-none opacity-50"
											: "cursor-pointer"
									}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				)}
			</div>
			<div className="flex flex-row flex-wrap content-start items-start w-full p-2">
				{assets.map((asset) => (
					<UnifiedAssetCard key={asset.id} asset={asset} />
				))}
			</div>
		</main>
	);
}
