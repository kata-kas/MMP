import { SettingsContext } from "@/core/settings/settingsContext";
import { TempFile } from "@/tempfiles/entities/TempFile";
import { IconTrash, IconFileArrowRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import useAxios from "axios-hooks";
import { useContext, useEffect, useRef, useState } from "react";
import { ProjectSelect } from "./parts/project-select/ProjectSelect";
import { Project } from "@/projects/entities/Project";
import { Header } from "@/core/header/Header";
import { toast } from "sonner";

export function TempFiles() {
    const reload = useRef(Math.floor(1000 + Math.random() * 9000));
    const { settings } = useContext(SettingsContext);
    const [tempFiles, setTempFiles] = useState<TempFile[]>([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [, callSendToProject] = useAxios({ url: `${settings.localBackend}/tempfiles/xxx`, method: 'post' }, { manual: true })
    const [, callDeleteTemp] = useAxios({ url: `${settings.localBackend}/tempfiles/xxx/delete`, method: 'post' }, { manual: true })
    const [{ data, loading }] = useAxios<TempFile[]>(
        `${settings.localBackend}/tempfiles?_=${reload.current}`
    );
    useEffect(() => {
        if (!data) return;
        setTempFiles(data);
    }, [data]);

    const [{ data: projects, loading: pLoading }] = useAxios<Project[]>(
        `${settings.localBackend}/projects/list?_=${reload.current}`
    );

    const setProjectUUID = (i: number, p: Project) => {
        const copy = [...tempFiles]
        copy[i].project_uuid = p.uuid
        setTempFiles(copy)
    }

    const sendToProject = (i: number) => {
        if (!tempFiles[i].project_uuid) return;
        setActionLoading((s) => !s)
        callSendToProject({
            url: `${settings.localBackend}/tempfiles/${tempFiles[i].uuid}`,
            data: tempFiles[i]
        })
            .then(() => {
                const copy = [...tempFiles]
                copy.splice(i, 1)
                setTempFiles(copy)
                toast.success('Great Success!', {
                    description: 'Temporary moved to project!',
                })
                setActionLoading((s) => !s)
            })
            .catch((e) => {
                console.log(e)
                setActionLoading((s) => !s)
            });
    }

    const deleteTemp = (i: number) => {
        setActionLoading((s) => !s)
        callDeleteTemp({
            url: `${settings.localBackend}/tempfiles/${tempFiles[i].uuid}/delete`
        })
            .then(() => {
                const copy = [...tempFiles]
                copy.splice(i, 1)
                setTempFiles(copy)
                toast.success('Great Success!', {
                    description: 'Temporary successfully deleted!',
                })
                setActionLoading((s) => !s)
            })
            .catch((e) => {
                console.log(e)
                setActionLoading((s) => !s)
            });
    }

    return (<>
        <Header imagePath={'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?q=80&w=2000&h=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'} />
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tempFiles.map((t, i) => (
                    <TableRow key={t.uuid}>
                        <TableCell>{t.name}</TableCell>
                        <TableCell>
                            <ProjectSelect boosted={t.matches} projects={projects} onChange={(p) => { setProjectUUID(i, p) }} loading={pLoading} value={t.project_uuid} />
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center justify-center gap-2">
                                <Button 
                                    variant="default" 
                                    size="icon" 
                                    onClick={() => sendToProject(i)} 
                                    disabled={actionLoading}
                                    aria-label="Send to project"
                                >
                                    <IconFileArrowRight className="h-4 w-4" stroke={1.5} />
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    size="icon" 
                                    onClick={() => deleteTemp(i)} 
                                    disabled={actionLoading}
                                    aria-label="Delete"
                                >
                                    <IconTrash className="h-4 w-4" stroke={1.5} />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
                {loading && Array.from(Array(10))
                    .map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-8" /></TableCell>
                            <TableCell><Skeleton className="h-8" /></TableCell>
                            <TableCell><Skeleton className="h-8" /></TableCell>
                        </TableRow>
                    ))}
            </TableBody>
        </Table>
    </>)
}
