import SSEContext from "@/core/sse/SSEContext";
import { Job } from "@/printers/entities/Printer";
import { Progress } from "@/components/ui/progress";
import { useContext, useEffect } from "react";
import { useId } from 'react';
import { useCumulativeEvent } from "@/core/sse/useCumulativeEvent";

interface PrintProgressBarProps {
    printerUuid: string;
}
export function PrintProgressBar({ printerUuid }: PrintProgressBarProps) {
    const subscriberId = useId();
    const { connected, subscribe, unsubscribe } = useContext(SSEContext)
    const [job, setJob] = useCumulativeEvent<Job>({ progress: 0 });

    useEffect(() => {
        if (!connected) return;
        setJob({ progress: 0 });
        const subscription = {
            subscriberId,
            provider: `printers/${printerUuid}`,
        }
        subscribe({
            ...subscription,
            event: `printer.update.${printerUuid}.job_status`,
            callback: setJob
        }).catch(() => {});
        return () => {
            unsubscribe(subscriberId)
        }
    }, [printerUuid, connected, subscriberId, subscribe, unsubscribe, setJob])
    return (
        <Progress value={job.progress * 100} className="h-1" />
    )
}
