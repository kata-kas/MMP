import { IconFileArrowRight, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Header } from "@/core/header/Header";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useApiQuery } from "@/hooks/use-api-query";
import { logger } from "@/lib/logger";
import type { Project } from "@/projects/entities/Project";
import type { TempFile } from "@/tempfiles/entities/TempFile";
import { ProjectSelect } from "./parts/project-select/ProjectSelect";

export function TempFiles() {
	const [tempFiles, setTempFiles] = useState<TempFile[]>([]);
	const { data, loading } = useApiQuery<TempFile[]>({
		url: "/tempfiles",
	});

	const { data: projects, loading: pLoading } = useApiQuery<Project[]>({
		url: "/projects/list",
	});

	useEffect(() => {
		if (data) {
			setTempFiles(data);
		}
	}, [data]);

	const sendToProjectMutation = useApiMutation<
		TempFile,
		{ uuid: string; tempFile: TempFile }
	>({
		url: (vars) => `/tempfiles/${vars.uuid}`,
		method: "post",
	});

	const deleteTempMutation = useApiMutation<void, { uuid: string }>({
		url: (vars) => `/tempfiles/${vars.uuid}/delete`,
		method: "post",
	});

	const setProjectUUID = (i: number, p: Project) => {
		const copy = [...tempFiles];
		copy[i].project_uuid = p.uuid;
		setTempFiles(copy);
	};

	const sendToProject = (i: number) => {
		if (!tempFiles[i].project_uuid) return;
		const tempFile = tempFiles[i];
		sendToProjectMutation
			.mutate({ uuid: tempFile.uuid, tempFile })
			.then(() => {
				const copy = [...tempFiles];
				copy.splice(i, 1);
				setTempFiles(copy);
				toast.success("Great Success!", {
					description: "Temporary moved to project!",
				});
			})
			.catch((e) => {
				logger.error(e);
			});
	};

	const deleteTemp = (i: number) => {
		const tempFile = tempFiles[i];
		deleteTempMutation
			.mutate({ uuid: tempFile.uuid })
			.then(() => {
				const copy = [...tempFiles];
				copy.splice(i, 1);
				setTempFiles(copy);
				toast.success("Great Success!", {
					description: "Temporary successfully deleted!",
				});
			})
			.catch((e) => {
				logger.error(e);
			});
	};

	const actionLoading =
		sendToProjectMutation.loading || deleteTempMutation.loading;

	return (
		<>
			<Header
				imagePath={
					"https://images.unsplash.com/photo-1587293852726-70cdb56c2866?q=80&w=2000&h=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
				}
			/>
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
								<ProjectSelect
									boosted={t.matches}
									projects={projects}
									onChange={(p) => {
										setProjectUUID(i, p);
									}}
									loading={pLoading}
									value={t.project_uuid}
								/>
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
					{loading &&
						Array.from(Array(10)).map((_, i) => (
							<TableRow key={`skeleton-row-${i}`}>
								<TableCell>
									<Skeleton className="h-8" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-8" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-8" />
								</TableCell>
							</TableRow>
						))}
				</TableBody>
			</Table>
		</>
	);
}
