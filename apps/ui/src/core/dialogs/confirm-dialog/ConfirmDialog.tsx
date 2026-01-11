import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
	opened: boolean;
	onOk: () => void;
	onCancel?: () => void;
}

export function ConfirmDialog({ opened, onOk, onCancel }: ConfirmDialogProps) {
	const [isOpen, setIsOpen] = useState(opened);

	useEffect(() => {
		setIsOpen(opened);
	}, [opened]);

	const handleCancel = () => {
		setIsOpen(false);
		onCancel?.();
	};

	const handleOk = () => {
		setIsOpen(false);
		onOk();
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Are you sure?</DialogTitle>
				</DialogHeader>
				<DialogFooter>
					<Button variant="destructive" onClick={handleOk}>
						Yes, leave me alone!
					</Button>
					<Button variant="outline" onClick={handleCancel}>
						No
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
