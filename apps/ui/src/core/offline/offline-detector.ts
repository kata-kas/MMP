import { useOffline } from "./OfflineContext";

export function useOfflineState() {
	const { isOffline } = useOffline();
	return isOffline;
}
