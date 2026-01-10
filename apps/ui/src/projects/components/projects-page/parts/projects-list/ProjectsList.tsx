import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "./parts/project-filter-card/ProjectFilterCard.tsx";
import { ProjectCard } from "./parts/project-card/ProjectCard.tsx";
import { useSearchParams } from "react-router-dom";
import useAxios from "axios-hooks";
import { useContext, useEffect, useRef, useState } from "react";
import { Project } from "@/projects/entities/Project.ts";
import { SettingsContext } from "@/core/settings/settingsContext.ts";
import { ProjectFilter } from "./parts/project-filter/ProjectFilter.tsx";

export function ProjectsList() {
    const [searchParams, setSearchParams] = useSearchParams();
    const reload = useRef(Math.floor(1000 + Math.random() * 9000));
    const { settings } = useContext(SettingsContext);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState('20')
    const [projects, setProjects] = useState<Project[]>([])
    const [filter, setFilter] = useState<Filter>({ name: '', tags: [] })
    const [{ data, loading, error }] = useAxios<{ items?: Project[]; page?: number; total_pages?: number }>(
        `${settings.localBackend}/projects?page=${page - 1}&size=${perPage}${filter.name ? '&name=' + filter.name : ''}${filter.tags.length > 0 ? '&tags=' + filter.tags?.join(",") : ''}&_=${reload.current}`
    );
    useEffect(() => {
        if (!data?.items) return;
        setProjects(data.items)
    }, [data]);
    useEffect(() => {
        if (!searchParams.get('filter')) return;
        setFilter(JSON.parse(searchParams.get('filter') ?? ''))
    }, [searchParams])

    if (error) return <p>Error!</p>;

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
