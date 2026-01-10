import SSEContext from "@/core/sse/SSEContext";
import { useId } from "react";
import { useContext, useEffect, useState } from "react";
import { logger } from "@/lib/logger";

type RefresherProps = {
    projectUUID: string;
    refresh: () => void;
}

export function Refresher({ projectUUID, refresh }: RefresherProps) {
    const subscriberId = useId();
    const { connected, subscribe, unsubscribe } = useContext(SSEContext)
    const [projectUpdate, setProjectUpdate] = useState({} as Record<string, unknown>)
    const [, setError] = useState<Error | null>(null);
    useEffect(() => {
        if (!connected) return;
        setProjectUpdate({})
        const subscription = {
            subscriberId,
            provider: `system/events`,
        }
        subscribe({
            ...subscription,
            event: `system.state.project.event`,
            callback: setProjectUpdate
        }).catch(setError);
        return () => {
            unsubscribe(subscriberId)
        }
    }, [connected, subscriberId, subscribe, unsubscribe])

    useEffect(() => {
        if (!projectUpdate.state) return;
        const state = projectUpdate.state as Record<string, unknown>;
        if (state?.projectUUID == projectUUID && state?.type == "update") {
            refresh();
        }
    }, [projectUpdate, projectUUID, refresh])
    return (<></>)
}
