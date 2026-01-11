import axios, { type AxiosError } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getErrorConfig } from "./error-config";
import { setupAxiosErrorInterceptor } from "./setup-axios-interceptor";

describe("Error Handler Integration", () => {
	let showErrorToast: (options: {
		title: string;
		description: string;
		duration: number;
	}) => void;
	let cleanup: () => void;

	beforeEach(() => {
		vi.clearAllMocks();
		showErrorToast = vi.fn();
		cleanup = setupAxiosErrorInterceptor(showErrorToast, false);
	});

	afterEach(() => {
		if (cleanup) {
			cleanup();
		}
	});

	describe("full error flow", () => {
		it("should handle 500 error end-to-end", async () => {
			const error = {
				response: {
					status: 500,
					data: {
						message: "Internal server error",
					},
				},
			} as AxiosError;

			vi.spyOn(axios, "isCancel").mockReturnValue(false);

			const config = getErrorConfig(error, false);

			if (config.severity === "toast") {
				showErrorToast({
					title: config.title,
					description: config.description,
					duration: config.duration,
				});
			}

			expect(showErrorToast).toHaveBeenCalledWith({
				title: "Server Error",
				description: "Internal server error",
				duration: 6000,
			});
		});

		it("should handle network error with offline detection", async () => {
			const error = {
				message: "Network Error",
				request: {},
			} as AxiosError;

			vi.spyOn(axios, "isCancel").mockReturnValue(false);

			const config = getErrorConfig(error, true);

			if (config.severity === "toast") {
				showErrorToast({
					title: config.title,
					description: config.description,
					duration: config.duration,
				});
			}

			expect(showErrorToast).toHaveBeenCalledWith({
				title: "Offline",
				description: "You appear to be offline. Please check your connection.",
				duration: 8000,
			});
		});

		it("should not show toast for 404 errors", async () => {
			const error = {
				response: {
					status: 404,
					data: {},
				},
			} as AxiosError;

			vi.spyOn(axios, "isCancel").mockReturnValue(false);

			const config = getErrorConfig(error, false);

			if (config.severity === "toast") {
				showErrorToast({
					title: config.title,
					description: config.description,
					duration: config.duration,
				});
			}

			expect(showErrorToast).not.toHaveBeenCalled();
		});

		it("should not show toast for cancelled requests", async () => {
			const error = {
				message: "Request cancelled",
			} as AxiosError;

			vi.spyOn(axios, "isCancel").mockReturnValue(true);

			const config = getErrorConfig(error, false);

			if (config.severity === "toast") {
				showErrorToast({
					title: config.title,
					description: config.description,
					duration: config.duration,
				});
			}

			expect(showErrorToast).not.toHaveBeenCalled();
		});
	});

	describe("toast deduplication integration", () => {
		it("should process identical errors with same config", () => {
			const error1 = {
				response: {
					status: 500,
					data: { message: "Server error" },
				},
			} as AxiosError;

			const error2 = {
				response: {
					status: 500,
					data: { message: "Server error" },
				},
			} as AxiosError;

			vi.spyOn(axios, "isCancel").mockReturnValue(false);

			const config1 = getErrorConfig(error1, false);
			const config2 = getErrorConfig(error2, false);

			expect(config1).toEqual(config2);
			expect(config1.severity).toBe("toast");
			expect(config1.title).toBe("Server Error");
			expect(config1.description).toBe("Server error");
		});
	});

	describe("offline detection integration", () => {
		it("should use offline state in error config", () => {
			const error = {
				message: "Network Error",
				request: {},
			} as AxiosError;

			vi.spyOn(axios, "isCancel").mockReturnValue(false);

			const onlineConfig = getErrorConfig(error, false);
			const offlineConfig = getErrorConfig(error, true);

			expect(onlineConfig.title).toBe("Network Error");
			expect(offlineConfig.title).toBe("Offline");
			expect(offlineConfig.description).toContain("offline");
		});
	});
});
