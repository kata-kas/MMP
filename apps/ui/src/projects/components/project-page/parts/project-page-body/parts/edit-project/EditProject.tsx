import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectForm } from "@/projects/components/parts/project-form/ProjectForm.tsx";
import type { Project } from "@/projects/entities/Project.ts";
import { ProjectOperations } from "./parts/project-operations/ProjectOperations";

type EditProjectProps = {
	project: Project;
	onProjectChange: (p: Project) => void;
};

export function EditProject({ project, onProjectChange }: EditProjectProps) {
	return (
		<Tabs defaultValue="edit" orientation="vertical" className="flex gap-6">
			<TabsList className="flex flex-col h-fit w-[180px]">
				<TabsTrigger value="edit" className="w-full justify-start">
					Edit
				</TabsTrigger>
				<TabsTrigger value="operations" className="w-full justify-start">
					Operations
				</TabsTrigger>
			</TabsList>
			<div className="flex-1 min-w-0">
				<TabsContent value="edit" className="mt-0">
					<div className="container mx-auto max-w-4xl">
						<ProjectForm project={project} onProjectChange={onProjectChange} />
					</div>
				</TabsContent>
				<TabsContent value="operations" className="mt-0">
					<div className="container mx-auto max-w-4xl">
						<ProjectOperations
							project={project}
							onProjectChange={onProjectChange}
						/>
					</div>
				</TabsContent>
			</div>
		</Tabs>
	);
}
