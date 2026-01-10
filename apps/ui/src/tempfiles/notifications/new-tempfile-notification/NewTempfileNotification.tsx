import SSEContext from "@/core/sse/SSEContext";
import { toast } from "sonner";
import { useId, useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";

export function NewTempfileNotification() {
    const subscriberId = useId();
    const { connected, subscribe, unsubscribe } = useContext(SSEContext)
    const [message, setMessage] = useState({} as Record<string, unknown>)
    const [_error, setError] = useState<Error | null>(null);
    useEffect(() => {
        if (!connected) return;
        setMessage({})
        const subscription = {
            subscriberId,
            provider: `system/events`,
        }
        subscribe({
            ...subscription,
            event: `system.state.tempfile.new`,
            callback: setMessage
        }).catch(setError);
        return () => {
            unsubscribe(subscriberId)
        }
    }, [connected])

    useEffect(() => {
        console.log(message)
        if (!message.state) return;
        const state = message.state as Record<string, unknown>;
        toast.success(`New temp file uploaded!`, {
            description: (
                <span>
                    Go to <Link to={`/tempfiles`} className="underline">{(state?.name as string)}</Link>
                </span>
            ),
        })
    }, [message])
    return (<></>)
}
