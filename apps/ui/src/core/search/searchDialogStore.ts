import { useSyncExternalStore } from "react";

type State = {
	open: boolean;
};

let state: State = { open: false };
const listeners = new Set<() => void>();

function emit() {
	for (const l of listeners) l();
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

function getSnapshot() {
	return state;
}

function getServerSnapshot() {
	return state;
}

export function setSearchDialogOpen(open: boolean) {
	if (state.open === open) return;
	state = { open };
	emit();
}

export function openSearchDialog() {
	setSearchDialogOpen(true);
}

export function closeSearchDialog() {
	setSearchDialogOpen(false);
}

export function useSearchDialogOpen() {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot).open;
}
