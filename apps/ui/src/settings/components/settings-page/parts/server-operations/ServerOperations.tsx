import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/core/dialogs/confirm-dialog/ConfirmDialog";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { logger } from "@/lib/logger";

export function ServerOperations() {
	const [isOpen, setIsOpen] = useState(false);
	const discoveryMutation = useApiMutation<void, void>({
		url: "/system/discovery",
		method: "get",
	});

	const onOk = useCallback(() => {
		setIsOpen(false);
		discoveryMutation
			.mutate(undefined)
			.then(() => {
				toast.success("Great Success!", {
					description: "Global discovery started",
				});
			})
			.catch((e) => {
				logger.error(e);
			});
	}, [discoveryMutation]);
	return (
		<fieldset className="space-y-4 rounded-lg border p-4">
			<legend className="px-2 text-sm font-medium">Discovery</legend>
			<Button
				onClick={() => setIsOpen(true)}
				disabled={discoveryMutation.loading}
			>
				Run discovery
			</Button>
			<ConfirmDialog
				opened={isOpen}
				onOk={onOk}
				onCancel={() => setIsOpen(false)}
			/>
		</fieldset>
	);
}
