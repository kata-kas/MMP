import SSEContext from "@/core/sse/SSEContext";
import { useId } from "react";
import { toast } from "sonner";
import { useContext, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { logger } from "@/lib/logger";

type RefresherProps = {
    projectUUID: string;
}

export function Refresher({ projectUUID }: RefresherProps) {
    const subscriberId = useId();
    const { connected, subscribe, unsubscribe } = useContext(SSEContext)
    const [assetUpdate, setAssetUpdate] = useState({} as Record<string, unknown>)
    
    const handleError = useCallback((error: Error) => {
        logger.error('SSE subscription error', error);
    }, []);

    useEffect(() => {
        if (!connected) return;
        setAssetUpdate({})
        const subscription = {
            subscriberId,
            provider: `system/events`,
        }
        subscribe({
            ...subscription,
            event: `system.state.asset.event`,
            callback: setAssetUpdate
        }).catch(handleError);
        return () => {
            unsubscribe(subscriberId)
        }
    }, [connected, subscriberId, subscribe, unsubscribe, handleError])

    useEffect(() => {
        if (!assetUpdate.state) return;
        const state = assetUpdate.state as Record<string, unknown>;
        if (projectUUID == state?.projectUUID) {
            toast.info(`Assets have changed`, {
                description: (
                    <Link to={`/projects/${projectUUID}`} className="underline" reloadDocument>
                        Refresh
                    </Link>
                ),
            })
        }
    }, [assetUpdate, projectUUID])
    return (<></>)
}
