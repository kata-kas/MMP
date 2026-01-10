import { SettingsContext } from "@/core/settings/settingsContext";
import { Project } from "@/projects/entities/Project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { IconHomeMove } from "@tabler/icons-react";
import useAxios from "axios-hooks";
import { useContext, useState } from "react";
import { DeleteBtn } from "./delete-btn/DeleteBtn";
import { DiscoverBtn } from "./discover-btn/DiscoverBtn";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type ProjectOperationsProps = {
    project: Project;
    onProjectChange: (p: Project) => void;
}

export function ProjectOperations({ project, onProjectChange }: ProjectOperationsProps) {
    const { settings } = useContext(SettingsContext);

    const [path, setPath] = useState(project.path);
    const [open, setOpen] = useState(false);
    const [{ loading }, moveProject] = useAxios({
        method: 'post',
    }, { manual: true })
    const [{ data: paths, loading: lPaths, error: ePaths }] = useAxios(
        {
            url: `${settings.localBackend}/system/paths`
        }
    )
    const onMoveHandler = () => {
        moveProject({
            url: `${settings.localBackend}/projects/${project.uuid}/move`,
            data: {
                uuid: project.uuid,
                path: path
            }
        }).then(({ data }) => {
            console.log(data);
            setPath(data.path)
            toast.success('Great Success!', {
                description: 'Project moved',
            })
        })
            .catch((e) => {
                console.log(e)
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
                                {paths?.map((p: string) => (
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
                    disabled={loading}
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
