import SSEContext from "@/core/sse/SSEContext";
import { useId } from "react";
import { toast } from "sonner";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { logger } from "@/lib/logger";

export function NewProjectNotification() {
    const subscriberId = useId();
    const { connected, subscribe, unsubscribe } = useContext(SSEContext)
    const [message, setMessage] = useState({} as Record<string, unknown>)
    const [, setError] = useState<Error | null>(null);
    useEffect(() => {
        if (!connected) return;
        setMessage({})
        const subscription = {
            subscriberId,
            provider: `system/events`,
        }
        subscribe({
            ...subscription,
            event: `system.state.project.event`,
            callback: setMessage
        }).catch(setError);
        return () => {
            unsubscribe(subscriberId)
        }
    }, [connected, subscriberId, subscribe, unsubscribe])

    useEffect(() => {
        if (!message.state) return;
        const state = message.state as Record<string, unknown>;
        if (state?.type == "new") {
            toast.success(`New project found`, {
                description: (
                    <span>
                        Go to <Link to={`/projects/${state?.projectUUID}`} className="underline">{(state?.projectName as string)}</Link>
                    </span>
                ),
            })
        }
    }, [message])
    return (<></>)
}
