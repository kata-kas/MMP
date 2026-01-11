import { Project } from "@/projects/entities/Project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { IconHomeMove } from "@tabler/icons-react";
import { useState } from "react";
import { DeleteBtn } from "./delete-btn/DeleteBtn";
import { DiscoverBtn } from "./discover-btn/DiscoverBtn";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";

type ProjectOperationsProps = {
    project: Project;
    onProjectChange: (p: Project) => void;
}

export function ProjectOperations({ project }: ProjectOperationsProps) {
    const [path, setPath] = useState(project.path);
    const [open, setOpen] = useState(false);
    
    const { data: paths, loading: lPaths } = useApiQuery<string[]>({
        url: '/system/paths',
    });

    const moveProjectMutation = useApiMutation<{ path: string }, { uuid: string; path: string }>({
        url: (vars) => `/projects/${vars.uuid}/move`,
        method: 'post',
    });

    const onMoveHandler = () => {
        moveProjectMutation.mutate({ uuid: project.uuid, path })
            .then((data) => {
                setPath(data.path ?? project.path)
                toast.success('Great Success!', {
                    description: 'Project moved',
                })
            })
            .catch((e) => {
                logger.error(e)
            });
    }
    return (<>
        <div className="space-y-2">
            <Label>Move to</Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                        disabled={lPaths}
                    >
                        {path || "Select path..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                    <Command>
                        <CommandInput placeholder="Search path..." />
                        <CommandList>
                            <CommandEmpty>No path found.</CommandEmpty>
                            <CommandGroup>
                                {paths?.map((p) => (
                                    <CommandItem
                                        key={p}
                                        value={p}
                                        onSelect={() => {
                                            setPath(p);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                path === p ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {p}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <div className="flex items-center gap-2">
                <Input
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    placeholder="Enter path"
                    className="flex-1"
                />
                <Button
                    size="icon"
                    onClick={onMoveHandler}
                    disabled={moveProjectMutation.loading}
                >
                    <IconHomeMove className="h-4 w-4" stroke={1.5} />
                </Button>
            </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
            <DiscoverBtn projectUuid={project.uuid} />
            <DeleteBtn projectUuid={project.uuid} />
        </div>
    </>)
}
