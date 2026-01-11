import type { Meta, StoryObj } from "@storybook/react";
import { Upload, X } from "lucide-react";
import { Button } from "./button";
import {
	DropZoneArea,
	Dropzone,
	DropzoneDescription,
	DropzoneFileList,
	DropzoneFileListItem,
	DropzoneFileMessage,
	DropzoneMessage,
	DropzoneRemoveFile,
	DropzoneRetryFile,
	DropzoneTrigger,
	InfiniteProgress,
	useDropzone,
} from "./dropzone";

const meta: Meta<typeof Dropzone> = {
	title: "Components/UI/Dropzone",
	component: Dropzone,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Dropzone component for file uploads with drag and drop support.",
			},
		},
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Dropzone>;

const BasicDropzoneExample = () => {
	const dropzone = useDropzone({
		onDropFile: async (file) => {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			return {
				status: "success" as const,
				result: { url: `https://example.com/${file.name}` },
			};
		},
		validation: {
			accept: {
				"image/*": [".png", ".jpg", ".jpeg", ".gif"],
			},
			maxSize: 5 * 1024 * 1024,
			maxFiles: 5,
		},
	});

	return (
		<Dropzone {...dropzone}>
			<div className="flex flex-col gap-4 w-[500px]">
				<DropZoneArea>
					<div className="flex flex-col items-center gap-2 py-8">
						<Upload className="h-8 w-8 text-muted-foreground" />
						<div className="text-center">
							<DropzoneTrigger>
								<span className="text-sm font-medium">Click to upload</span>
							</DropzoneTrigger>
							<DropzoneDescription>or drag and drop</DropzoneDescription>
						</div>
						<p className="text-xs text-muted-foreground">
							PNG, JPG, GIF up to 5MB
						</p>
					</div>
				</DropZoneArea>
				<DropzoneMessage />
				<DropzoneFileList>
					{dropzone.fileStatuses.map((file) => (
						<DropzoneFileListItem key={file.id} file={file}>
							<div className="flex items-center justify-between">
								<div className="flex-1">
									<p className="text-sm font-medium">{file.fileName}</p>
									<InfiniteProgress status={file.status} />
									<DropzoneFileMessage />
								</div>
								<div className="flex gap-2">
									{file.status === "error" && (
										<DropzoneRetryFile>
											<Button variant="ghost" size="icon">
												<span className="sr-only">Retry</span>
											</Button>
										</DropzoneRetryFile>
									)}
									<DropzoneRemoveFile>
										<Button variant="ghost" size="icon">
											<X className="h-4 w-4" />
											<span className="sr-only">Remove</span>
										</Button>
									</DropzoneRemoveFile>
								</div>
							</div>
						</DropzoneFileListItem>
					))}
				</DropzoneFileList>
			</div>
		</Dropzone>
	);
};

export const Default: Story = {
	render: () => <BasicDropzoneExample />,
};
