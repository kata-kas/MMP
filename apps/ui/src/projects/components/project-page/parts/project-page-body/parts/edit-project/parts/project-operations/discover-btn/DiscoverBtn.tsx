import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/core/dialogs/confirm-dialog/ConfirmDialog";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { logger } from "@/lib/logger";

interface DiscoverBtnProps {
	projectUuid: string;
}

export function DiscoverBtn({ projectUuid }: DiscoverBtnProps) {
	const [isOpen, setIsOpen] = useState(false);
	const discoveryMutation = useApiMutation<void, void>({
		url: `/projects/${projectUuid}/discover`,
	});

	const onOk = useCallback(() => {
		setIsOpen(false);
		discoveryMutation
			.mutate(undefined)
			.then(() => {
				toast.success("Great Success!", {
					description: "Project discovery started",
				});
			})
			.catch((e) => {
				logger.error(e);
			});
	}, [discoveryMutation]);

	return (
		<>
			<Button
				onClick={() => setIsOpen(true)}
				disabled={discoveryMutation.loading}
			>
				{discoveryMutation.loading ? "Starting..." : "Run discovery"}
			</Button>
			<ConfirmDialog
				opened={isOpen}
				onOk={onOk}
				onCancel={() => setIsOpen(false)}
			/>
		</>
	);
}
