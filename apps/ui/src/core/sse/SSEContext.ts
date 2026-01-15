import {createContext, SetStateAction} from "react";

export type Subscription = {
	subscriberId: string;
	provider: string;
	event: string;
	callback: (data: SetStateAction<Record<string, unknown>>) => void;
};

interface SSEConnectionContextType {
	connected: boolean;
	loading: boolean;
	error: Error | null;
}

interface SSEActionsContextType {
	subscribe: (sub: Subscription) => Promise<Error | null>;
	unsubscribe: (subscriberId: string) => void;
}

export const SSEConnectionContext = createContext<SSEConnectionContextType>({
	connected: false,
	loading: false,
	error: null,
});

export const SSEActionsContext = createContext<SSEActionsContextType>({
	subscribe: () => Promise.resolve(null),
	unsubscribe: () => {},
});
