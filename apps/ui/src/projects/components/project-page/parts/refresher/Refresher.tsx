import { useContext, useEffect, useId, useState } from "react";
import { SSEActionsContext, SSEConnectionContext } from "@/core/sse/SSEContext";

type RefresherProps = {
	projectUUID: string;
	refresh: () => void;
};

export function Refresher({ projectUUID, refresh }: RefresherProps) {
	const subscriberId = useId();
	const { connected } = useContext(SSEConnectionContext);
	const { subscribe, unsubscribe } = useContext(SSEActionsContext);
	const [projectUpdate, setProjectUpdate] = useState(
		{} as Record<string, unknown>,
	);
	const [, setError] = useState<Error | null>(null);
	useEffect(() => {
		if (!connected) return;
		setProjectUpdate({});
		const subscription = {
			subscriberId,
			provider: `system/events`,
		};
		subscribe({
			...subscription,
			event: `system.state.project.event`,
			callback: setProjectUpdate,
		}).catch(setError);
		return () => {
			unsubscribe(subscriberId);
		};
	}, [connected, subscriberId, subscribe, unsubscribe]);

	useEffect(() => {
		if (!projectUpdate.state) return;
		const state = projectUpdate.state as Record<string, unknown>;
		if (state?.projectUUID === projectUUID && state?.type === "update") {
			refresh();
		}
	}, [projectUpdate, projectUUID, refresh]);
	return null;
}
