import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "./parts/project-filter-card/ProjectFilterCard.tsx";
import { ProjectCard } from "./parts/project-card/ProjectCard.tsx";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Project } from "@/projects/entities/Project.ts";
import { ProjectFilter } from "./parts/project-filter/ProjectFilter.tsx";
import { logger } from "@/lib/logger";
import { useApiQuery } from "@/hooks/use-api-query";

export function ProjectsList() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState('20')
    const [filter, setFilter] = useState<Filter>({ name: '', tags: [] })
    
    const queryParams = useMemo(() => {
        const params = new URLSearchParams({
            page: (page - 1).toString(),
            size: perPage,
        });
        if (filter.name) params.append('name', filter.name);
        if (filter.tags.length > 0) params.append('tags', filter.tags.join(','));
        return params.toString();
    }, [page, perPage, filter.name, filter.tags]);

    const { data, loading, error } = useApiQuery<{ items?: Project[]; page?: number; total_pages?: number }>({
        url: `/projects?${queryParams}`,
    });

    const projects = data?.items ?? [];
    useEffect(() => {
        const filterParam = searchParams.get('filter');
        if (!filterParam) return;
        try {
            setFilter(JSON.parse(filterParam));
        } catch (e) {
            logger.error('Failed to parse filter from URL', e);
        }
    }, [searchParams])

    if (error && !loading) {
        return (
            <div className="container mx-auto my-2 w-full">
                <p className="text-destructive">Failed to load projects. Please try again.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto my-2 w-full">
            <div className="mb-4 flex items-center gap-2">
                <ProjectFilter value={filter} onChange={(filter) => { setFilter(filter); setSearchParams({ ...searchParams, filter: JSON.stringify(filter) }); }} />
                <Select value={perPage} onValueChange={(v) => { if (v) { setPage(1); setPerPage(v) } }}>
                    <SelectTrigger className="ml-auto w-[120px]">
                        <SelectValue placeholder="Pick value" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                </Select>
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious 
                                onClick={() => setPage(Math.max(1, page - 1))}
                                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationLink onClick={() => setPage(page)}>
                                {data?.page ? data.page + 1 : page}
                            </PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext 
                                onClick={() => setPage(Math.min((data?.total_pages || 1), page + 1))}
                                className={page >= (data?.total_pages || 1) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
            <div className="flex flex-wrap items-start justify-center gap-4">
                {loading && Array.from(Array(3))
                    .map((_, i) => (
                        <Skeleton
                            key={i}
                            className="h-[280px] min-h-[280px] min-w-[280px] w-[280px]"
                        />
                    ))}
                {!loading && projects.map((i) => <ProjectCard key={i.uuid} project={i} />)}
            </div>
        </div>
    );
}
