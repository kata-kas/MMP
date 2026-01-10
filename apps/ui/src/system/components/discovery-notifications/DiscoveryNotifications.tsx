import SSEContext from "@/core/sse/SSEContext";
import { useId } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { useContext, useEffect, useState } from "react";

export function DiscoveryNotifications() {
    const subscriberId = useId();
    const { connected, subscribe, unsubscribe } = useContext(SSEContext)
    const [toastId, setToastId] = useState<string | number | null>(null);
    const [message, setMessage] = useState({} as any)
    const [error, setError] = useState<Error | null>(null);
    useEffect(() => {
        if (!connected) return;
        setMessage("")
        const subscription = {
            subscriberId,
            provider: `system/events`,
        }
        subscribe({
            ...subscription,
            event: `system.state.discovery.scan`,
            callback: setMessage
        }).catch(setError);
        return () => {
            unsubscribe(subscriberId)
        }
    }, [connected])

    useEffect(() => {
        console.log(message)
        if (!message.state) return;
        if (message.state.state == "started") {
            const id = toast.loading("New Scan started", {
                description: "Let's find new projects!",
            });
            setToastId(id);
        } else if (toastId) {
            toast.success('Scan finished!', {
                id: toastId,
                description: '',
                icon: <Check className="h-4 w-4" />,
            });
            setToastId(null);
        }
    }, [message, toastId])
    return (<></>)
}
