import { Image as ImageIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useDropzone } from "@/components/ui/dropzone";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

type AddAssetProps = {
	projectUuid: string;
};

export function AddAsset({ projectUuid }: AddAssetProps) {
	const saveAssetMutation = useApiMutation<void, FormData>({
		url: `/projects/${projectUuid}/assets`,
		method: "post",
	});

	const dropzone = useDropzone({
		onDrop: (acceptedFiles) => {
			for (const file of acceptedFiles) {
				const formData = new FormData();
				formData.append("project_uuid", projectUuid);
				formData.append("files", file);
				saveAssetMutation
					.mutate(formData)
					.then(() => {
						toast.success("Great Success!", {
							description: "Asset added to your project!",
						});
					})
					.catch((e) => {
						logger.error(e);
					});
			}
		},
	});

	return (
		<div className="container mx-auto max-w-4xl">
			<div
				{...dropzone.getRootProps()}
				className={cn(
					"flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
					dropzone.isDragActive && "border-primary bg-primary/5",
					saveAssetMutation.loading && "opacity-50 pointer-events-none",
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
						<p className="text-xl font-medium">
							Drag assets here or click to select files
						</p>
						<p className="mt-2 text-sm text-muted-foreground">
							Attach as many files as you like
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
