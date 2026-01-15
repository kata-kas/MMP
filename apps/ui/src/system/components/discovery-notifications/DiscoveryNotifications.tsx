import { Check } from "lucide-react";
import { useContext, useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { SSEActionsContext, SSEConnectionContext } from "@/core/sse/SSEContext";

export function DiscoveryNotifications() {
	const subscriberId = useId();
	const { connected } = useContext(SSEConnectionContext);
	const { subscribe, unsubscribe } = useContext(SSEActionsContext);
	const [toastId, setToastId] = useState<string | number | null>(null);
	const [message, setMessage] = useState({} as Record<string, unknown>);
	const [, setError] = useState<Error | null>(null);
	useEffect(() => {
		if (!connected) return;
		setMessage({} as Record<string, unknown>);
		const subscription = {
			subscriberId,
			provider: `system/events`,
		};
		subscribe({
			...subscription,
			event: `system.state.discovery.scan`,
			callback: setMessage,
		}).catch(setError);
		return () => {
			unsubscribe(subscriberId);
		};
	}, [connected, subscriberId, subscribe, unsubscribe]);

	useEffect(() => {
		if (!message["state"]) return;
		const state = message["state"] as Record<string, unknown>;
		if (state?.["state"] === "started") {
			const id = toast.loading("New Scan started", {
				description: "Let's find new projects!",
			});
			setToastId(id);
		} else if (toastId) {
			toast.success("Scan finished!", {
				id: toastId,
				description: "",
				icon: <Check className="h-4 w-4" />,
			});
			setToastId(null);
		}
	}, [message, toastId]);
	return null;
}
