import { useNavigate } from "react-router-dom";
import { ProjectForm } from "@/projects/components/parts/project-form/ProjectForm";
import { Project } from "@/projects/entities/Project.ts";
import { logger } from "@/lib/logger";

export function CreateProject() {
    const navigate = useNavigate();
    const project = {
        uuid: "",
        name: "",
        description: "",
        path: "",
        external_link: "",
        tags: [],
        default_image_id: "",
        default_image_name: "",
        initialized: false,
        assets: []
    };

    const onSave = (project: Project) => {
        navigate(`/projects/${project.uuid}`)
    }

    return (
        <div className="container mx-auto max-w-4xl">
            <ProjectForm project={project} onProjectChange={onSave} withUpload={true} />
        </div>
    );
}
