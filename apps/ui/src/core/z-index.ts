// Z-index scale using increments of 10 for base layers, 100 for major layers
// This allows room for intermediate values (e.g., 11-19 for overlays, 101-199 for toasts)
export const Z_INDEX = {
	BASE: 0,
	OVERLAY: 10,
	SCROLL_TO_TOP: 50,
	TOAST: 100,
	LOADING: 1000,
	MODAL: 1100,
} as const;
