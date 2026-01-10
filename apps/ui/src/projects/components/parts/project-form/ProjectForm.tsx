import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagsInput } from "@/components/ui/tags-input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { Project } from "../../../entities/Project.ts";
import useAxios from "axios-hooks";
import { useContext, useState } from "react";
import { SettingsContext } from "@/core/settings/settingsContext.ts";
import { toast } from "sonner";
import { useDropzone } from "@/components/ui/dropzone";
import { UploadPreview } from "../upload-preview/UploadPreview.tsx";
import { cn } from "@/lib/utils";
import { Upload, X, Image as ImageIcon } from "lucide-react";

type ProjectFormProps = {
    project: Project;
    onProjectChange: (p: Project) => void;
    withUpload?: boolean;
};

export function ProjectForm({ project, onProjectChange, withUpload }: ProjectFormProps) {
    const { settings } = useContext(SettingsContext);
    const [files, setFiles] = useState<File[]>([]);
    const [{ data, loading, error }, executeSave] = useAxios(
        {
            method: 'POST'
        },
        { manual: true }
    )
    
    const form = useForm<Project & { tags: string[] }>({
        defaultValues: {
            tags: project.tags?.map(t => t.value) || [],
            ...project,
        },
    });

    const dropzone = useDropzone({
        onDrop: (acceptedFiles) => {
            setFiles(prev => [...prev, ...acceptedFiles]);
        },
    });

    const onSave = (formData: Project & { tags: string[] }) => {
        const formDataToSend = new FormData();
        const projectData = {
            ...formData,
            tags: formData.tags.map(t => ({ value: t }))
        };
        formDataToSend.append("payload", JSON.stringify(projectData))
        if (files.length > 0) {
            files.forEach((file) => formDataToSend.append("files", file));
        }
        executeSave({
            url: `${settings.localBackend}/projects${project.uuid ? "/" + project.uuid : ''}`,
            data: formDataToSend
        })
            .then(({ data }) => {
                onProjectChange(data)
                toast.success('Great Success!', {
                    description: 'Project updated',
                })
            })
            .catch((e) => {
                console.log(e)
            });
    };

    return (
        <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    {...form.register("name", { required: "Name is required", minLength: { value: 2, message: "Too short name" } })}
                />
                {form.formState.errors.name && (
                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    {...form.register("description")}
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="external_link">External Link</Label>
                <Input
                    id="external_link"
                    {...form.register("external_link")}
                />
            </div>
            
            <TagsInput
                label="Tags"
                maxDropdownHeight={200}
                value={form.watch("tags") || []}
                onChange={(v) => form.setValue("tags", v)}
                splitChars={[',', ' ', '|']}
                clearable
            />
            
            {withUpload && (
                <>
                    <div
                        {...dropzone.getRootProps()}
                        className={cn(
                            "flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
                            dropzone.isDragActive && "border-primary bg-primary/5"
                        )}
                    >
                        <input {...dropzone.getInputProps()} />
                        <div className="flex flex-col items-center gap-4">
                            {dropzone.isDragActive ? (
                                <Upload className="h-12 w-12 text-primary" />
                            ) : dropzone.isDragReject ? (
                                <X className="h-12 w-12 text-destructive" />
                            ) : (
                                <ImageIcon className="h-12 w-12 text-muted-foreground" />
                            )}
                            <div className="text-center">
                                <p className="text-lg font-medium">
                                    Drag assets here or click to select files
                                </p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Attach as many files as you like
                                </p>
                            </div>
                        </div>
                    </div>
                    <UploadPreview 
                        files={files} 
                        selected={form.watch("default_image_name")} 
                        onChange={(name) => form.setValue("default_image_name", name)} 
                    />
                </>
            )}
            
            <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                    {loading ? "Submitting..." : "Submit"}
                </Button>
            </div>
        </form>
    );
}
