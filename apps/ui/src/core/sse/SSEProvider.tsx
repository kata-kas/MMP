import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SettingsContext } from "../settings/settingsContext";
import {
	SSEActionsContext,
	SSEConnectionContext,
	type Subscription,
} from "./SSEContext";
import {
	createSubsManager,
	type SubscriptionManager,
} from "./SubscriptionManager";

export function SSEProvider({ children }: React.PropsWithChildren) {
	const { settings } = useContext(SettingsContext);

	const [subManager, setSubManager] = useState<SubscriptionManager>();

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [connected, setConnected] = useState<boolean>(false);

	useEffect(() => {
		if (!settings.localBackend) {
			return;
		}

		setLoading(true);
		setConnected(false);
		setError(null);
		const manager = createSubsManager(settings.localBackend);
		setSubManager(manager);

		manager.onConnect(() => {
			setLoading(false);
			setConnected(true);
		});

		manager.onError((error) => {
			setLoading(false);
			setConnected(false);
			setError(error);
		});

		manager.connect();

		return () => {
			manager.close();
		};
	}, [settings.localBackend]);

	const subscribe = useCallback(
		(sub: Subscription) => {
			return subManager?.subscribe(sub) ?? Promise.resolve(null);
		},
		[subManager],
	);

	const unsubscribe = useCallback(
		(subscriberId: string) => {
			subManager?.unsubscribe(subscriberId);
		},
		[subManager],
	);

	const connectionValue = useMemo(
		() => ({
			connected,
			loading,
			error,
		}),
		[connected, loading, error],
	);

	const actionsValue = useMemo(
		() => ({
			subscribe,
			unsubscribe,
		}),
		[subscribe, unsubscribe],
	);

	return (
		<SSEConnectionContext.Provider value={connectionValue}>
			<SSEActionsContext.Provider value={actionsValue}>
				{children}
			</SSEActionsContext.Provider>
		</SSEConnectionContext.Provider>
	);
}
