import { Card } from '@/components/ui/card';
import { Project } from "@/projects/entities/Project.ts";
import { Link } from "react-router-dom";
import { SettingsContext } from '@/core/settings/settingsContext';
import { useContext } from 'react';
import { cn } from "@/lib/utils";

type ProjectCardProps = {
    project: Project,
}

export function ProjectCard({ project }: ProjectCardProps) {
    const { settings } = useContext(SettingsContext);

    return (
        <Link to={`/projects/${project.uuid}`} className="block">
            <Card 
                className={cn(
                    "h-[280px] min-h-[280px] min-w-[280px] w-[280px]",
                    "relative overflow-hidden transition-transform hover:scale-[1.03]",
                    "cursor-pointer"
                )}
            >
                {project.default_image_id && (
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500"
                        style={{
                            backgroundImage: `url(${settings?.localBackend || '/api'}/projects/${project.uuid}/assets/${project.default_image_id}/file)`,
                        }}
                    />
                )}
                {!project.default_image_id && (
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500"
                        style={{
                            backgroundImage: `url(https://picsum.photos/seed/${project.uuid}/280)`,
                        }}
                    />
                )}
                <div className="absolute top-[20%] left-0 right-0 bottom-0 bg-gradient-to-b from-transparent via-transparent to-black/85" />
                <div className="relative z-10 flex h-full flex-col justify-end p-4">
                    <p className="text-sm font-medium text-white">
                        {project.name}
                    </p>
                </div>
            </Card>
        </Link>
    );
}
