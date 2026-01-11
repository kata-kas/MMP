import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/core/dialogs/confirm-dialog/ConfirmDialog";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { logger } from "@/lib/logger";

interface DeleteBtnProps {
	projectUuid: string;
}

export function DeleteBtn({ projectUuid }: DeleteBtnProps) {
	const navigate = useNavigate();
	const [isOpen, setIsOpen] = useState(false);
	const deleteProjectMutation = useApiMutation<void, void>({
		url: `/projects/${projectUuid}/delete`,
		method: "post",
	});

	const onOk = useCallback(() => {
		setIsOpen(false);
		deleteProjectMutation
			.mutate(undefined)
			.then(() => {
				toast.success("Great Success!", {
					description: "Project deleted",
				});
				navigate(`/projects?tab=list`);
			})
			.catch((e) => {
				logger.error(e);
			});
	}, [deleteProjectMutation, navigate]);

	return (
		<>
			<Button
				variant="destructive"
				onClick={() => setIsOpen(true)}
				disabled={deleteProjectMutation.loading}
			>
				{deleteProjectMutation.loading ? "Deleting..." : "Delete Project"}
			</Button>
			<ConfirmDialog
				opened={isOpen}
				onOk={onOk}
				onCancel={() => setIsOpen(false)}
			/>
		</>
	);
}
