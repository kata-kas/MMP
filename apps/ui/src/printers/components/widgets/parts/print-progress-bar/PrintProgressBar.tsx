import { useContext, useEffect, useId } from "react";
import { Progress } from "@/components/ui/progress";
import { SSEActionsContext, SSEConnectionContext } from "@/core/sse/SSEContext";
import { useCumulativeEvent } from "@/core/sse/useCumulativeEvent";
import type { Job } from "@/printers/entities/Printer";

interface PrintProgressBarProps {
	printerUuid: string;
}
export function PrintProgressBar({ printerUuid }: PrintProgressBarProps) {
	const subscriberId = useId();
	const { connected } = useContext(SSEConnectionContext);
	const { subscribe, unsubscribe } = useContext(SSEActionsContext);
	const [job, setJob] = useCumulativeEvent<Job>({ progress: 0 });

	useEffect(() => {
		if (!connected) return;
		setJob({ progress: 0 });
		const subscription = {
			subscriberId,
			provider: `printers/${printerUuid}`,
		};
		subscribe({
			...subscription,
			event: `printer.update.${printerUuid}.job_status`,
			callback: setJob,
		}).catch(() => {});
		return () => {
			unsubscribe(subscriberId);
		};
	}, [printerUuid, connected, subscriberId, subscribe, unsubscribe, setJob]);
	return <Progress value={job.progress * 100} className="h-1" />;
}
