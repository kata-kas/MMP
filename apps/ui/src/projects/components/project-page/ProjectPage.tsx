import { useNavigate, useParams } from "react-router-dom";
import { Project } from "../../entities/Project.ts";
import { ProjectPageBody } from "./parts/project-page-body/ProjectPageBody.tsx";
import { Header } from "@/core/header/Header.tsx";
import { Refresher } from "./parts/refresher/Refresher.tsx";
import { useApiQuery } from "@/hooks/use-api-query";
import { SettingsContext } from "@/core/settings/settingsContext";
import { useCallback, useContext } from "react";

export function ProjectPage() {
    const navigate = useNavigate();
    const { settings } = useContext(SettingsContext);
    const { id } = useParams();

    const { data: project, loading, error, refetch } = useApiQuery<Project>({
        url: `/projects/${id}`,
        enabled: !!id,
    });

    const handleRefetch = useCallback(() => {
        refetch();
    }, [refetch]);
    return (
        <>
            <Header
                loading={loading}
                title={project?.name}
                description={project?.description}
                tags={project?.tags}
                link={project?.external_link}
                imagePath={settings?.localBackend ? `${settings.localBackend}/projects/${project?.uuid}/assets/${project?.default_image_id}/file` : undefined}
                onTagClick={(t) => navigate(`/projects/list?filter=${JSON.stringify({ tags: [t.value] })}`)}
            />
            {error && !loading && (
                <div className="container mx-auto my-2">
                    <p className="text-destructive">Failed to load project. Please try again.</p>
                </div>
            )}
            {id && project && <ProjectPageBody projectUuid={id} project={project} onProjectChange={handleRefetch} />}
            {id && <Refresher projectUUID={id} refresh={handleRefetch} />}
        </>
    )
}